import { T } from '@start9labs/start-sdk'
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

// Minimal structural view of the init FullProgressTracker (not exported from
// the SDK); we only start and complete a named phase.
type InitProgress = {
  addPhase(
    name: string,
    contribution?: number | null,
  ): { start(): void; complete(): void }
}

export const bootstrapNextcloud = sdk.setupOnInit(
  async (effects, kind, progress) => {
    if (kind === 'install') {
      const installing = progress.addPhase(i18n('Installing Nextcloud'))
      installing.start()

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

      installing.complete()

      await storeJson.merge(effects, { adminPassword })

      await sdk.action.createOwnTask(effects, getAdminCredentials, 'critical', {
        reason: i18n(
          'Display your admin password so you can administer your Nextcloud instance',
        ),
      })
    } else if (kind === 'update') {
      await upgradeNextcloud(effects, progress)
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
 * `NEXTCLOUD_UPDATE=1` makes the stock entrypoint perform the upgrade with a
 * no-op command (`true`) and exit, so it never binds a port. `runUntilSuccess`
 * brings up Postgres + Valkey (occ upgrade talks to both), runs the upgrade to
 * completion, then tears everything down. On failure or timeout it throws,
 * which fails init and triggers the snapshot rollback.
 */
async function upgradeNextcloud(effects: T.Effects, progress: InitProgress) {
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
        `Nextcloud only supports upgrading one major version at a time, and one or more intermediate ` +
        `major releases were skipped.`,
    )
  }

  const upgrading = progress.addPhase(i18n('Upgrading Nextcloud'))
  upgrading.start()

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
      },
      requires: ['chown', 'postgres', 'valkey'],
    })
    .runUntilSuccess(UPGRADE_TIMEOUT)

  upgrading.complete()
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
