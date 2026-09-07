import { T, utils } from '@start9labs/start-sdk'
import { getAdminCredentials } from '../actions/getAdminCredentials'
import { storeJson } from '../fileModels/store.json'
import { i18n } from '../i18n'
import { sdk } from '../sdk'
import {
  getBaseDaemons,
  getNextcloudEnv,
  getNextcloudSub,
  getPostgresEnv,
  getPostgresSub,
  getRandomPassword,
  getValkeySub,
  nextcloudMount,
} from '../utils'

// occ upgrade completes in minutes even on large instances, but cap it so a
// genuinely stuck migration eventually fails init and StartOS rolls the update
// back instead of hanging forever.
const UPGRADE_TIMEOUT = 1_800_000

export const bootstrapNextcloud = sdk.setupOnInit(
  async (effects, kind, progress) => {
    if (kind === 'install') {
      const starting = progress.addPhase(i18n('Starting the database'), 1)
      const copying = progress.addPhase(i18n('Copying application files'), 3)
      const schema = progress.addPhase(i18n('Creating the database'), 2)

      starting.start()

      const adminPassword = getRandomPassword()
      const postgresPassword = getRandomPassword()

      const nextcloudSub = await getNextcloudSub(effects)
      const valkeySub = await getValkeySub(effects)
      const postgresEnv = getPostgresEnv()

      await getBaseDaemons(
        effects,
        await getPostgresSub(effects),
        nextcloudSub,
        valkeySub,
        { ...postgresEnv, POSTGRES_PASSWORD: postgresPassword },
      )
        .addDaemon('nextcloud', {
          subcontainer: nextcloudSub,
          exec: {
            command: sdk.useEntrypoint(),
            env: {
              ...getNextcloudEnv(postgresEnv),
              POSTGRES_PASSWORD: postgresPassword,
              NEXTCLOUD_ADMIN_USER: 'admin',
              NEXTCLOUD_ADMIN_PASSWORD: adminPassword,
            },
            ...entrypointProgress(starting, [
              ['Initializing nextcloud', copying],
              ['Starting nextcloud installation', schema],
            ]),
          },
          ready: {
            display: null,
            fn: async () => {
              const status = await nextcloudSub.execFail(
                ['php', 'occ', 'status'],
                {
                  user: 'www-data',
                },
              )

              if (status.stdout.includes('installed: true')) {
                return {
                  result: 'success',
                  message: null,
                }
              } else {
                return {
                  result: 'failure',
                  message: null,
                }
              }
            },
          },
          requires: ['chown', 'postgres', 'valkey'],
        })
        .runUntilSuccess(300_000)

      starting.complete()
      copying.complete()
      schema.complete()

      await storeJson.merge(effects, { adminPassword })

      await sdk.action.createOwnTask(effects, getAdminCredentials, 'critical', {
        reason: i18n(
          'Display your admin password so you can administer your Nextcloud instance',
        ),
      })
    } else if (kind === 'update') {
      await runUpstreamUpgrade(effects, progress)
    }
  },
)

/**
 * Run the upstream image's own version upgrade (sync new code → `occ upgrade` →
 * app bookkeeping) here in init, where StartOS has snapshotted the volumes so a
 * failed migration rolls the whole update back cleanly. Previously this ran at
 * daemon start via the entrypoint, where an interrupted run stranded the
 * instance on "Update needed — use the command line updater".
 *
 * This is the **upstream application** upgrade, triggered by the bundled
 * Nextcloud release being newer than the deployed one — not to be confused with
 * the one-time **StartOS layout** migration in
 * [`../versions/from035x.ts`](../versions/from035x.ts), which is driven by the
 * package version graph. Both run during init; `versionGraph` precedes
 * `bootstrapNextcloud` in `sdk.setupInit`, so the 0.3.5x migration has always
 * finished before this starts.
 *
 * `NEXTCLOUD_UPDATE=1` makes the stock entrypoint perform the upgrade with a
 * no-op command (`true`) and exit, so it never binds a port. `runUntilSuccess`
 * brings up Postgres + Valkey (occ upgrade talks to both), runs the upgrade to
 * completion, then tears everything down. On failure or timeout it throws,
 * which fails init and triggers the snapshot rollback.
 */
async function runUpstreamUpgrade(
  effects: T.Effects,
  progress: utils.FullProgressTracker,
) {
  // Read the installed (on-volume) and image Nextcloud versions first.
  // version.php on the volume is still the installed version — the entrypoint
  // syncs new code only once the upgrade runs.
  const { installed, image } = await sdk.SubContainer.withTemp(
    effects,
    { imageId: 'nextcloud' },
    nextcloudMount,
    'nextcloud-version-check',
    async (sub) => {
      const readVersion = async (path: string): Promise<number[] | null> => {
        const res = await sub.exec([
          'php',
          '-r',
          `if (is_file("${path}")) { require "${path}"; echo implode(",", $OC_Version); }`,
        ])
        const parts = res.stdout
          .toString()
          .trim()
          .split(',')
          .map((p) => parseInt(p, 10))
        return parts.length > 0 && parts.every((n) => Number.isFinite(n))
          ? parts
          : null
      }
      return {
        installed: await readVersion('/var/www/html/version.php'),
        image: await readVersion('/usr/src/nextcloud/version.php'),
      }
    },
  )

  // Skip the whole chain when there's nothing to upgrade — either we can't tell,
  // or the image isn't newer than what's installed (e.g. a StartOS-only revision
  // bump) — rather than spinning up containers for a no-op entrypoint run.
  if (!installed || !image || cmpVersion(image, installed) <= 0) return

  // Nextcloud only supports upgrading one major version at a time. Fail up front
  // with a clear message rather than letting the entrypoint refuse mid-run and
  // spin until the init timeout.
  if (image[0] > installed[0] + 1) {
    throw new Error(
      `Cannot update Nextcloud from major version ${installed[0]} directly to ${image[0]}. ` +
        `Nextcloud only supports upgrading one major version at a time. Update to a release ` +
        `bundling Nextcloud ${installed[0] + 1} first — open this service in the Marketplace and ` +
        `pick it from the version list — then update again.`,
    )
  }

  const copying = progress.addPhase(i18n('Copying application files'), 1)
  const migrating = progress.addPhase(i18n('Migrating the database'), 3)

  copying.start()

  const nextcloudSub = await getNextcloudSub(effects)
  const valkeySub = await getValkeySub(effects)
  const postgresEnv = getPostgresEnv()

  await getBaseDaemons(
    effects,
    await getPostgresSub(effects),
    nextcloudSub,
    valkeySub,
    postgresEnv,
  )
    .addOneshot('upgrade', {
      subcontainer: nextcloudSub,
      exec: {
        command: sdk.useEntrypoint(['true']),
        env: { ...getNextcloudEnv(postgresEnv), NEXTCLOUD_UPDATE: '1' },
        // The pre-upgrade hook scan is the only line between the file sync and `occ upgrade`.
        ...entrypointProgress(copying, [
          ['=> Searching for hook scripts', migrating],
        ]),
      },
      requires: ['chown', 'postgres', 'valkey'],
    })
    .runUntilSuccess(UPGRADE_TIMEOUT)

  copying.complete()
  migrating.complete()
}

// Phase boundaries read off the stock entrypoint's own narration; wording it stops
// printing leaves a phase indeterminate rather than stalling init.
function entrypointProgress(
  from: utils.PhaseHandle,
  steps: ReadonlyArray<readonly [string, utils.PhaseHandle]>,
) {
  let current = from
  let next = 0
  let tail = ''

  return {
    onStdout: (chunk: Buffer | string) => {
      process.stdout.write(chunk)

      // A marker can straddle two chunks, so match on the carry-over too.
      const text = tail + chunk
      tail = text.slice(-4096)

      while (next < steps.length && text.includes(steps[next][0])) {
        current.complete()
        current = steps[next][1]
        current.start()
        next++
      }
    },
    // Either callback pipes all three streams, so stderr has to be drained too.
    onStderr: (chunk: Buffer | string) => process.stderr.write(chunk),
  }
}

// Compare dotted version tuples element-wise: negative if a < b, 0 if equal,
// positive if a > b. Missing trailing elements count as zero.
function cmpVersion(a: number[], b: number[]): number {
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    const d = (a[i] ?? 0) - (b[i] ?? 0)
    if (d !== 0) return d
  }
  return 0
}
