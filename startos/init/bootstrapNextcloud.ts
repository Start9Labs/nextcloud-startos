import {
  ExtendedVersion,
  getDataVersion,
  setDataVersion,
  T,
  utils,
} from '@start9labs/start-sdk'
import { getAdminCredentials } from '../actions/getAdminCredentials'
import { storeJson } from '../fileModels/store.json'
import { i18n } from '../i18n'
import { sdk } from '../sdk'
import { priorVersions } from '../versions'
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

// Sideload build only: the bundled Nextcloud images, one major apart, in the
// order an instance passes through them.
const HOPS = ['nextcloud-33', 'nextcloud'] as const

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
 * Refuse a Nextcloud major skip ahead of the version graph: on a volume StartOS
 * could not snapshot — a package migrated from 0.3.5.x has none until its next
 * boot — nothing init changes is undone, so the graph must not move the data
 * version for a release whose Nextcloud cannot start here. A data version an
 * earlier attempt already moved is set back to the newest vertex the installed
 * Nextcloud satisfies, which the release the error names accepts.
 */
export const guardUpstreamUpgrade = sdk.setupOnInit(async (effects, kind) => {
  if (kind !== 'update') return
  const { installed, image } = await readNextcloudVersions(effects, HOPS[0])
  if (!installed || !image || image[0] <= installed[0] + 1) return

  const dataVersion = await getDataVersion(effects)
  const floor = priorVersions
    .map((v) => ExtendedVersion.parse(v.options.version))
    .filter((v) => v.upstream.number[0] <= installed[0])
    .sort((a, b) => b.compareForSort(a))[0]
  if (
    floor &&
    dataVersion instanceof ExtendedVersion &&
    dataVersion.upstream.number[0] > installed[0] + 1
  ) {
    await setDataVersion(effects, floor)
  }

  throw new Error(
    `Cannot update Nextcloud from major version ${installed[0]} directly to ${image[0]}. ` +
      `Nextcloud only supports upgrading one major version at a time. Update to a release ` +
      `bundling Nextcloud ${installed[0] + 1} first — open this service in the Marketplace and ` +
      `pick it from the version list — then update again.`,
  )
})

/**
 * The Nextcloud release on the volume and the one in the image, as version
 * tuples. `version.php` on the volume stays at the installed release until
 * the entrypoint's upgrade has synced new code over it.
 */
function readNextcloudVersions(
  effects: T.Effects,
  imageId: (typeof HOPS)[number] = 'nextcloud',
) {
  return sdk.SubContainer.withTemp(
    effects,
    { imageId },
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
}

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
  for (const imageId of HOPS) {
    const { installed, image } = await readNextcloudVersions(effects, imageId)

    // Skip a hop with nothing to upgrade — either we can't tell, or its image
    // isn't newer than what's installed (e.g. a StartOS-only revision bump) —
    // rather than spinning up containers for a no-op entrypoint run.
    if (!installed || !image || cmpVersion(image, installed) <= 0) continue

    await upgradeWith(effects, progress, imageId)
  }
}

async function upgradeWith(
  effects: T.Effects,
  progress: utils.FullProgressTracker,
  imageId: (typeof HOPS)[number],
) {
  const copying = progress.addPhase(i18n('Copying application files'), 1)
  const migrating = progress.addPhase(i18n('Migrating the database'), 3)

  copying.start()

  const nextcloudSub = await getNextcloudSub(effects, imageId)
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
