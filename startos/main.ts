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
})

/**
 * Run a long-running `php occ` command for action `id` as www-data, streaming
 * output to StartOS service logs. On normal exit, returns Date.now() and the
 * caller writes it to `actions.completed[id]` in store.json so the next chain
 * build sees the task as done. On abort (service stop or chain rebuild), the
 * child is SIGKILLed and we return null — no completed timestamp is written,
 * so the work resumes on next start. The Recognize/Memories commands are
 * idempotent on resume.
 *
 * On non-zero exit, the failure is visible in the streaming logs only. We
 * still record a completed timestamp so the chain doesn't loop indefinitely;
 * the user re-invokes the action (which writes a newer pending timestamp) to
 * retry.
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

  const tee = (
    stream: NodeJS.ReadableStream | null,
    mirror: NodeJS.WritableStream,
  ) => {
    stream?.on('data', (chunk: Buffer) => mirror.write(chunk))
  }
  tee(child.stdout, process.stdout)
  tee(child.stderr, process.stderr)

  await new Promise<void>((resolve) => child.on('exit', () => resolve()))
  if (abort.aborted) return null

  const ts = Date.now()
  await storeJson.merge(effects, {
    actions: { completed: { [id]: ts } },
  })
  return ts
}
