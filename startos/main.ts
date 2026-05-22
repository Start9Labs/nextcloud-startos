import { T } from '@start9labs/start-sdk'
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

  const nextcloudSub = await getNextcloudSub(effects)
  const valkeySub = await getValkeySub(effects)
  const postgresEnv = getPostgresEnv()

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
  return getBaseDaemons(
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
        nextcloudMount,
        'nextcloud-cron',
      ),
      exec: {
        command: ['/cron.sh'],
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
