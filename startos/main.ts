import { manifest as filebrowserManifest } from 'filebrowser-startos/startos/manifest'
import { T } from '@start9labs/start-sdk'
import {
  EXTERNAL_STORAGE_SOURCES,
  ExternalStorageSource,
  externalStorageMeta,
} from './externalStorage'
import { configPhp } from './fileModels/config.php'
import {
  ACTION_IDS,
  ActionId,
  isPending,
  storeJson,
} from './fileModels/store.json'
import { i18n } from './i18n'
import { sdk } from './sdk'
import {
  getBaseDaemons,
  getNextcloudEnv,
  getNextcloudSub,
  getPostgresEnv,
  getPostgresSub,
  getValkeySub,
  nextcloudMount,
  uiPort,
} from './utils'

const OCC_ARGS: Record<ActionId, string[]> = {
  downloadModels: ['recognize:download-models'],
  indexMemories: ['memories:index'],
  indexPlaces: ['memories:places-setup'],
  scanFiles: ['files:scan', '--all'],
  repair: ['maintenance:repair', '--no-interaction'],
}

// On failure a task's notification shows the last LOG_TAIL_LINES lines of its
// combined stdout/stderr ("View Details" body). The full output is always in
// the service logs; while the task runs we retain only this tail in memory, so
// a chatty command that prints thousands of progress lines never accumulates
// more than ~LOG_TAIL_LINES of them here.
const LOG_TAIL_LINES = 60

// Notification copy posted to the StartOS notifications panel when a
// long-running task's oneshot exits — `ok` on a clean exit (code 0), `failed`
// otherwise. The per-task health check disappears on the next chain rebuild,
// so this panel entry is the user's only durable signal that the work finished
// (and, on failure, that it needs re-running). Title + one-line message; on
// failure the notification also carries the exit code (or terminating signal)
// and the output tail as a markdown `data` body (built by `logDetails`).
const TASK_NOTICE: Record<
  ActionId,
  {
    ok: { title: string; message: string }
    failed: { title: string; message: string }
  }
> = {
  downloadModels: {
    ok: {
      title: i18n('Recognize Models Downloaded'),
      message: i18n(
        'The Recognize app has finished downloading its machine learning models. Object and face recognition is now available.',
      ),
    },
    failed: {
      title: i18n('Recognize Model Download Failed'),
      message: i18n(
        'The Recognize model download exited with an error — tap for the last log lines. Re-run the "Download Machine Learning Models for Recognize" action to retry.',
      ),
    },
  },
  indexMemories: {
    ok: {
      title: i18n('Memories Indexing Complete'),
      message: i18n('The Memories app has finished re-indexing your media.'),
    },
    failed: {
      title: i18n('Memories Indexing Failed'),
      message: i18n(
        'The Memories media re-index exited with an error — tap for the last log lines. Re-run the "Index Media for Memories" action to retry.',
      ),
    },
  },
  indexPlaces: {
    ok: {
      title: i18n('Memories Map Setup Complete'),
      message: i18n(
        'Map data has finished downloading and your photos have been re-indexed for reverse geotagging in the Memories app.',
      ),
    },
    failed: {
      title: i18n('Memories Map Setup Failed'),
      message: i18n(
        'The Memories map setup exited with an error — tap for the last log lines. Re-run the "Setup Map for Memories" action to retry.',
      ),
    },
  },
  scanFiles: {
    ok: {
      title: i18n('Scan Complete'),
      message: i18n(
        'The file cache has been rebuilt. Externally synced files should now appear correctly in the Nextcloud UI.',
      ),
    },
    failed: {
      title: i18n('File Scan Failed'),
      message: i18n(
        'The file scan exited with an error — tap for the last log lines. Re-run the "Scan Files" action to retry.',
      ),
    },
  },
  repair: {
    ok: {
      title: i18n('Repair Complete'),
      message: i18n(
        'Nextcloud has been repaired. If you were experiencing file or sharing issues, they should now be resolved.',
      ),
    },
    failed: {
      title: i18n('Repair Failed'),
      message: i18n(
        'The repair routine exited with an error — tap for the last log lines. Re-run the "Repair" action to retry.',
      ),
    },
  },
}

export const main = sdk.setupMain(async ({ effects }) => {
  /**
   * ======================== Setup ========================
   */
  console.info(i18n('Starting Nextcloud...'))

  // get interface details
  const hostnameInfo = await sdk.serviceInterface
    .getOwn(
      effects,
      'ui',
      (u) =>
        u?.addressInfo
          ?.filter({
            exclude: { kind: ['link-local', 'bridge'] },
          })
          .format('hostname-info') || [],
    )
    .const()

  await configPhp.merge(effects, {
    trusted_domains: hostnameInfo.map((h) =>
      h.metadata.kind === 'ipv6' ? `[${h.hostname}]` : h.hostname,
    ),
  })

  // Subscribe to `actions.pending` ONLY. The mapped value is the pending
  // timestamps object; runOcc's writes to `actions.completed` produce the same
  // mapped value, so the watcher's eq check dedups them and no chain rebuild
  // fires on task completion. Action invocations (which write `actions.pending`)
  // do change the mapped value and DO trigger a rebuild — that's how a newly
  // queued task gets picked up immediately.
  const pending =
    (await storeJson.read((s) => s.actions.pending).const(effects)) ?? {}
  // Snapshot completed timestamps non-reactively. The oneshot updates this
  // file as it finishes each task, but we don't want those writes to rebuild
  // the chain — re-reading inside the loop keeps our view current.
  const completed = (await storeJson.read().once())?.actions.completed ?? {}

  // External Storage: DESIRED sources read reactively (selecting/clearing the
  // `external-storage` action rebuilds the chain to mount/unmount the source),
  // CONFIGURED sources read non-reactively (the reconcile oneshot writes it; we
  // don't want that write to rebuild — same split as actions.pending vs
  // actions.completed above).
  const sources =
    (await storeJson.read((s) => s.externalStorages).const(effects)) ?? []
  const users =
    (await storeJson.read((s) => s.externalStorageUsers).const(effects)) ?? {}
  const configured =
    (await storeJson.read().once())?.externalStoragesConfigured ?? ''

  // Mount each selected source's volume into Nextcloud's container, read-write
  // so files can be moved out of it via the Files UI. The prep-external-storage
  // oneshot opens up permissions across the userns idmap (see prepScriptFor).
  let mounts = nextcloudMount
  if (sources.includes('filebrowser')) {
    mounts = mounts.mountDependency<typeof filebrowserManifest>({
      dependencyId: 'filebrowser',
      volumeId: 'data',
      subpath: null,
      mountpoint: externalStorageMeta.filebrowser.mountpoint,
      readonly: false,
    })
  }
  const nextcloudSub = await sdk.SubContainer.of(
    effects,
    { imageId: 'nextcloud' },
    mounts,
    'nextcloud-sub',
  )
  const valkeySub = await getValkeySub(effects)
  const postgresEnv = getPostgresEnv()

  // The cron container already mounts the selected sources; when any are
  // selected we run the permission-refresh loop in the background there (then
  // hand off to the normal cron entrypoint), so files the source creates after
  // startup stay writable/movable by Nextcloud — no extra container needed.
  const refresh = permsRefreshLoop(sources)
  const cronCommand: [string, ...string[]] = refresh
    ? ['sh', '-c', `(${refresh}) & exec /cron.sh`]
    : ['/cron.sh']

  // Build the live HealthCheckResult for a long-running-task health check.
  // Re-reads store.json each poll so the displayed state reflects in-flight
  // progress; the check itself is only attached when the chain-build snapshot
  // shows the task pending.
  const taskHealth = (id: ActionId, loadingMessage: string) => async () => {
    const s = await storeJson.read().once()
    const live = isPending(
      s?.actions.pending ?? {},
      s?.actions.completed ?? {},
      id,
    )
    if (live) {
      return { result: 'loading' as const, message: loadingMessage }
    }
    // pending cleared — task finished (success or failure). The check
    // disappears on the next chain rebuild; until then, show success briefly.
    return { result: 'success' as const, message: null }
  }

  /**
   * ======================== Daemons ========================
   */
  return (
    getBaseDaemons(
      effects,
      await getPostgresSub(effects),
      nextcloudSub,
      valkeySub,
      postgresEnv,
    )
      .addDaemon('nextcloud', {
        subcontainer: nextcloudSub,
        exec: {
          command: sdk.useEntrypoint(),
          env: getNextcloudEnv(postgresEnv),
        },
        ready: {
          display: i18n('Web Interface'),
          fn: () =>
            sdk.healthCheck.checkPortListening(effects, uiPort, {
              successMessage: i18n('The web interface is ready'),
              errorMessage: i18n('The web interface is not ready'),
            }),
        },
        requires: ['chown', 'postgres', 'valkey'],
      })
      .addDaemon('cron', {
        subcontainer: await sdk.SubContainer.of(
          effects,
          { imageId: 'nextcloud' },
          mounts,
          'nextcloud-cron',
        ),
        exec: {
          command: cronCommand,
          env: getNextcloudEnv(postgresEnv),
        },
        ready: {
          display: null,
          fn: async () => ({ result: 'success', message: null }),
        },
        requires: ['nextcloud'],
      })
      .addOneshot('long-running-tasks', {
        subcontainer: nextcloudSub,
        exec: {
          fn: async (subc, abort) => {
            // Walk pending in declared order. Each successful runOcc writes a
            // `completed[id]` timestamp into store.json. Chain rebuild on
            // completion is suppressed by the mapped subscription — it's the
            // pending bag, not completed, that's watched.
            const localCompleted = { ...completed }
            for (const id of ACTION_IDS) {
              if (abort.aborted) break
              if (!isPending(pending, localCompleted, id)) continue
              const ts = await runOcc(subc, abort, effects, id)
              if (ts != null) localCompleted[id] = ts
            }
            return null
          },
        },
        requires: ['nextcloud'],
      })
      // Open up permissions on each selected External Storage source so Nextcloud
      // (uid 33) can traverse, read, write and — critically — MOVE files out of
      // it across the userns idmap. Always present; a no-op (`true`) when nothing
      // is selected. Runs as root before the reconcile oneshot.
      .addOneshot('prep-external-storage', {
        subcontainer: nextcloudSub,
        exec: { command: ['sh', '-c', prepScriptFor(sources)], user: 'root' },
        requires: [],
      })
      // Reconcile Nextcloud's files_external entries to match the selected
      // sources: create/enable for newly selected sources, delete for cleared
      // ones, then record the actual state. Always present; a no-op when
      // desired == configured (same shape as long-running-tasks).
      .addOneshot('external-storage', {
        subcontainer: nextcloudSub,
        exec: {
          fn: async (subc, _abort) => {
            await reconcileExternalStorage(
              subc,
              _abort,
              effects,
              sources,
              users,
              configured,
            )
            return null
          },
        },
        requires: ['nextcloud', 'prep-external-storage'],
      })
      .addHealthCheck('recognize-models', () =>
        isPending(pending, completed, 'downloadModels')
          ? {
              ready: {
                display: i18n('Recognize Model Download'),
                fn: taskHealth(
                  'downloadModels',
                  i18n('Downloading machine learning models...'),
                ),
              },
              requires: ['nextcloud'] as const,
            }
          : null,
      )
      .addHealthCheck('memories-indexing', () =>
        isPending(pending, completed, 'indexMemories')
          ? {
              ready: {
                display: i18n('Memories Indexing'),
                fn: taskHealth(
                  'indexMemories',
                  i18n('Indexing photos for the Memories app...'),
                ),
              },
              requires: ['nextcloud'] as const,
            }
          : null,
      )
      .addHealthCheck('memories-map-setup', () =>
        isPending(pending, completed, 'indexPlaces')
          ? {
              ready: {
                display: i18n('Memories Map Setup'),
                fn: taskHealth(
                  'indexPlaces',
                  i18n('Setting up map data for the Memories app...'),
                ),
              },
              requires: ['nextcloud'] as const,
            }
          : null,
      )
      .addHealthCheck('scan-files', () =>
        isPending(pending, completed, 'scanFiles')
          ? {
              ready: {
                display: i18n('File Scan'),
                fn: taskHealth('scanFiles', i18n('Scanning files...')),
              },
              requires: ['nextcloud'] as const,
            }
          : null,
      )
      .addHealthCheck('repair', () =>
        isPending(pending, completed, 'repair')
          ? {
              ready: {
                display: i18n('Repair'),
                fn: taskHealth('repair', i18n('Repairing Nextcloud...')),
              },
              requires: ['nextcloud'] as const,
            }
          : null,
      )
  )
})

/**
 * Run a long-running `php occ` command for action `id` as www-data, streaming
 * output to StartOS service logs. On exit — success or failure — posts a
 * completion notification to the StartOS notifications panel (see TASK_NOTICE):
 * the task's health check vanishes on the next chain rebuild, so this is the
 * user's only durable signal that the work finished. Returns Date.now() and
 * the caller writes it to `actions.completed[id]` in store.json so the next
 * chain build sees the task as done. On abort (service stop or chain rebuild),
 * the child is SIGKILLed and we return null — no completed timestamp is
 * written and no notification is posted, so the work resumes on next start.
 * The Recognize/Memories commands are idempotent on resume.
 *
 * On non-zero exit we still record a completed timestamp so the chain doesn't
 * loop indefinitely; the error-level notification carries the tail of the
 * task's output in its details body and prompts the user to re-invoke the
 * action (which writes a newer pending timestamp) to retry.
 */
async function runOcc(
  subc: Awaited<ReturnType<typeof getNextcloudSub>>,
  abort: AbortSignal,
  effects: T.Effects,
  id: ActionId,
): Promise<number | null> {
  const child = await subc.spawn(['php', 'occ', ...OCC_ARGS[id]], {
    user: 'www-data',
    stdio: 'pipe',
  })
  if (abort.aborted) {
    child.kill('SIGKILL')
    return null
  }
  abort.addEventListener('abort', () => child.kill('SIGKILL'), { once: true })

  // Mirror output to the service logs, and retain just the tail — the last
  // LOG_TAIL_LINES lines plus the in-progress trailing line — for a failed
  // run's notification details. Both streams feed one buffer; if a stderr
  // write splits a stdout line the snippet is slightly garbled, which is
  // harmless for triage and rare (occ writes whole lines).
  let logBuf = ''
  const capture = (
    stream: NodeJS.ReadableStream | null,
    mirror: NodeJS.WritableStream,
  ) => {
    stream?.on('data', (chunk: Buffer) => {
      mirror.write(chunk)
      logBuf = (logBuf + chunk.toString())
        .split('\n')
        .slice(-(LOG_TAIL_LINES + 1))
        .join('\n')
    })
  }
  capture(child.stdout, process.stdout)
  capture(child.stderr, process.stderr)

  const exit = await new Promise<{
    code: number | null
    signal: NodeJS.Signals | null
  }>((resolve) => child.on('exit', (code, signal) => resolve({ code, signal })))
  if (abort.aborted) return null

  const failed = exit.code !== 0
  const notice = failed ? TASK_NOTICE[id].failed : TASK_NOTICE[id].ok
  await sdk.notification.create(effects, {
    level: failed ? 'error' : 'success',
    title: notice.title,
    message: notice.message,
    data: failed ? logDetails(notice.title, exit, logBuf) : null,
  })

  const ts = Date.now()
  await storeJson.merge(effects, {
    actions: { completed: { [id]: ts } },
  })
  return ts
}

/**
 * Markdown `data` body for a failed-task notification: a heading, the exit code
 * (or terminating signal — a SIGKILL we see here, having already returned on
 * abort, is almost always the kernel OOM killer), and the last LOG_TAIL_LINES
 * lines of the task's combined stdout/stderr in a code fence (or a short "no
 * output" line). The full output stays in the service logs — this is just
 * enough to triage from the notifications panel.
 */
function logDetails(
  title: string,
  exit: { code: number | null; signal: NodeJS.Signals | null },
  logBuf: string,
): string {
  const tail = logBuf
    .split('\n')
    .filter((l) => l.trim() !== '')
    .slice(-LOG_TAIL_LINES)
    .join('\n')
  const cause =
    exit.code != null
      ? [`${i18n('Exit code:')} ${exit.code}`]
      : exit.signal === 'SIGKILL'
        ? [
            `${i18n('Terminated by signal:')} SIGKILL`,
            '',
            i18n('SIGKILL usually means the task ran out of memory.'),
          ]
        : [`${i18n('Terminated by signal:')} ${exit.signal}`]
  return [
    `## ${title}`,
    '',
    ...cause,
    '',
    tail
      ? i18n('Last lines from the service log:')
      : i18n('The command produced no output before exiting.'),
    ...(tail ? ['', '```', tail, '```'] : []),
  ].join('\n')
}

/**
 * Open up a mounted source's tree so Nextcloud (uid 33) can MOVE files out of it
 * across the userns idmap. A "move" is copy-then-delete, so both halves need
 * permission:
 *   - directories -> `a+rwx`: traverse, and create/unlink within them. Deleting
 *     a file (the second half of a move) needs write+execute on its PARENT
 *     directory, not on the file.
 *   - files -> `a+rw`: read (to copy out) and write. The source does NOT
 *     reliably make its files other-readable — File Browser, for one, creates
 *     files mode 640 — so without this Nextcloud can't even read them to copy.
 * The `! -perm` filters skip entries that are already open, so steady state is
 * just the tree walk. The "other" class is idmap-safe (not tied to a uid).
 *
 * This chmod is the only reliable lever: StartOS doesn't expose the dependency
 * mount's idmap, so we can't make Nextcloud the *owner* (the clean fix, needing
 * no permission machinery); and POSIX default ACLs can't help (a new entry's
 * permissions are masked by the creating process's umask). Trailing `true` so a
 * partial `find` failure (e.g. a vanished path) doesn't fail the oneshot.
 */
function openPermsCmd(mountpoint: string): string {
  return (
    `find '${mountpoint}' -type d ! -perm -0007 -exec chmod a+rwx {} + 2>/dev/null; ` +
    `find '${mountpoint}' -type f ! -perm -0006 -exec chmod a+rw {} + 2>/dev/null; ` +
    `true`
  )
}

/**
 * Root script for the `prep-external-storage` oneshot: the INITIAL permission pass over each selected source, run before Nextcloud serves so
 * existing content is movable on first access. `true` (no-op) when nothing is
 * selected.
 */
function prepScriptFor(sources: ExternalStorageSource[]): string {
  if (sources.length === 0) return 'true'
  return sources
    .map((id) => openPermsCmd(externalStorageMeta[id].mountpoint))
    .join('\n')
}

/**
 * Background loop (run inside the cron container, which already mounts the
 * selected sources) that re-asserts permissions every
 * PERMS_REFRESH_SECS — so folders the source creates AFTER startup become
 * writable by Nextcloud, i.e. files dropped into the source become movable
 * within the interval without a restart. Dirs-only keeps each pass cheap.
 * Returns '' when nothing is selected (caller runs the plain cron entrypoint).
 *
 * NOTE: this is a deliberately minimal stopgap for a platform gap — the walk is
 * O(dirs) each pass (light for normal use, heavier on a very large source). The
 * clean fix is StartOS exposing the dependency mount's idmap; see openPermsCmd.
 */
const PERMS_REFRESH_SECS = 10
function permsRefreshLoop(sources: ExternalStorageSource[]): string {
  if (sources.length === 0) return ''
  const cmds = sources
    .map((id) => openPermsCmd(externalStorageMeta[id].mountpoint))
    .join('; ')
  return `while true; do ${cmds}; sleep ${PERMS_REFRESH_SECS}; done`
}

type OccMount = {
  mount_id: number | string
  mount_point: string
  applicable_users?: string[]
}

const normMountPoint = (s: string) => s.replace(/^\/+/, '')

const sameUsers = (a: string[], b: string[]) =>
  a.length === b.length && a.every((v, i) => v === b[i])

/**
 * Bring Nextcloud's `files_external` entries in line with the selected sources
 * and each source's chosen applicable users. For each selected source it
 * ensures a `files_external` mount exists and that its applicable-users set
 * matches that source's selection (empty = all users); for each KNOWN-but-
 * unselected source it deletes any matching mount. State is tracked by an
 * opaque signature of (sources + per-source users): if it already matches,
 * nothing runs; otherwise the full reconcile runs and — only if every
 * structural step (enable/create/delete) succeeded — the new signature is
 * recorded, so a failure retries on the next chain build. Failures are logged
 * rather than thrown, so one bad source never takes down the whole service.
 */
async function reconcileExternalStorage(
  subc: Awaited<ReturnType<typeof getNextcloudSub>>,
  abort: AbortSignal,
  effects: T.Effects,
  desired: ExternalStorageSource[],
  usersBySource: Record<string, string[]>,
  configured: string,
): Promise<void> {
  const enabled = [...desired].sort()
  // The applicable-user signature for a source (sorted, de-duped; [] = all).
  const usersFor = (id: ExternalStorageSource): string[] =>
    [...new Set(usersBySource[id] ?? [])].sort()
  // `v` bumps whenever the applied semantics change, so an existing install
  // re-reconciles once on upgrade even if the selection itself is unchanged
  // (v2: fixed applicable-users handling — see applyApplicable).
  const desiredSig = JSON.stringify({
    v: 2,
    sources: enabled,
    users: Object.fromEntries(enabled.map((id) => [id, usersFor(id)])),
  })
  // Treat a never-written signature ('') as "nothing selected" so a fresh
  // install with no selection short-circuits with zero occ calls (and never
  // touches a /FileBrowser mount a user may have created by hand).
  const emptySig = JSON.stringify({ v: 2, sources: [], users: {} })
  if (desiredSig === (configured || emptySig)) return

  const occ = (args: string[]) =>
    subc.exec(['php', 'occ', ...args], { user: 'www-data' })

  const listMounts = async (): Promise<OccMount[]> => {
    const res = await occ(['files_external:list', '--output=json'])
    if (res.exitCode !== 0) return []
    try {
      return JSON.parse(res.stdout.toString()) as OccMount[]
    } catch {
      return []
    }
  }
  const matchingMounts = (mounts: OccMount[], ncMountPoint: string) =>
    mounts.filter(
      (x) =>
        normMountPoint(String(x.mount_point ?? '')) ===
        normMountPoint(ncMountPoint),
    )

  // Bring a mount's applicable users in line with `desiredUsers`.
  //
  // Nextcloud semantics: a system mount with NO applicable users (and no
  // group/global entry) is available to ALL users; adding any user entry
  // restricts it to exactly those users. So:
  //   - empty desiredUsers  -> remove every currently-applicable user, leaving
  //                            it empty == available to all.
  //   - non-empty           -> `--remove-all` first (it clears the global flag
  //                            AND every existing user/group entry), THEN add
  //                            every desired user. We must re-add ALL of them,
  //                            including ones that were already in `current`,
  //                            because --remove-all just dropped them. (Skipping
  //                            "already-current" users was the cross-source bug:
  //                            a kept user got wiped and never re-added, so the
  //                            mount fell back to "available to everyone".)
  // Per-user `--add-user` calls keep this resilient to a user deleted in
  // Nextcloud since the selection was made (only that user's call fails).
  const applyApplicable = async (
    mountId: string,
    current: string[],
    desiredUsers: string[],
  ) => {
    const applicable = (...args: string[]) =>
      occ(['files_external:applicable', mountId, ...args])

    if (desiredUsers.length === 0) {
      // Available to all users == no specific applicable users.
      for (const u of current) await applicable('--remove-user', u)
    } else {
      // Restrict to exactly `desiredUsers`.
      await applicable('--remove-all')
      for (const u of desiredUsers) {
        const r = await applicable('--add-user', u)
        if (r.exitCode !== 0) {
          console.error(
            `external-storage: could not grant mount ${mountId} to user "${u}" (deleted in Nextcloud?): ${r.stderr.toString()}`,
          )
        }
      }
    }
  }

  let allOk = true

  if (desired.length > 0) {
    // files_external ships disabled on a fresh install; enabling an
    // already-enabled app is a no-op.
    const en = await occ(['app:enable', 'files_external'])
    if (en.exitCode !== 0) {
      allOk = false
      console.error(
        `external-storage: could not enable files_external app: ${en.stderr.toString()}`,
      )
    }
  }

  // Walk every KNOWN source so removals are handled without remembering the
  // previous selection: selected → ensure + set applicable; unselected → delete.
  for (const id of EXTERNAL_STORAGE_SOURCES) {
    if (abort.aborted) return
    const { ncMountPoint, mountpoint } = externalStorageMeta[id]
    try {
      if (desired.includes(id)) {
        let mount = matchingMounts(await listMounts(), ncMountPoint)[0]
        if (!mount) {
          const create = await occ([
            'files_external:create',
            ncMountPoint,
            'local',
            'null::null',
            '-c',
            `datadir=${mountpoint}`,
          ])
          if (create.exitCode !== 0) {
            allOk = false
            console.error(
              `external-storage: failed to create ${ncMountPoint}: ${create.stdout.toString()} ${create.stderr.toString()}`,
            )
            continue
          }
          mount = matchingMounts(await listMounts(), ncMountPoint)[0]
        }
        if (!mount) {
          allOk = false
          console.error(
            `external-storage: created ${ncMountPoint} but could not resolve its mount id`,
          )
          continue
        }
        const mountId = String(mount.mount_id)
        const wanted = usersFor(id)
        await applyApplicable(mountId, mount.applicable_users ?? [], wanted)
        console.info(
          `external-storage: ${ncMountPoint} (mount ${mountId}) available to ${
            wanted.length ? wanted.join(', ') : 'all users'
          }`,
        )
        // Rescan on access so out-of-band writes by the source service appear
        // in Nextcloud without a manual file scan.
        await occ([
          'files_external:option',
          mountId,
          'filesystem_check_changes',
          '1',
        ])
      } else {
        for (const m of matchingMounts(await listMounts(), ncMountPoint)) {
          const del = await occ([
            'files_external:delete',
            String(m.mount_id),
            '--yes',
          ])
          if (del.exitCode !== 0) {
            allOk = false
            console.error(
              `external-storage: failed to delete ${ncMountPoint} (id ${m.mount_id}): ${del.stderr.toString()}`,
            )
          }
        }
      }
    } catch (e) {
      allOk = false
      console.error(`external-storage: error reconciling ${id}: ${e}`)
    }
  }

  if (abort.aborted) return
  // Record the new signature only if every structural step succeeded, so a
  // failure retries next build. Written non-reactively (setupMain reads
  // externalStorages / externalStorageUsers, not this field, reactively) so the
  // write never rebuilds the chain. Plain string → merge replaces it wholesale.
  if (allOk) {
    await storeJson.merge(effects, { externalStoragesConfigured: desiredSig })
  }
}
