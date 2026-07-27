/**
 * The one-time StartOS 0.3.5x → 0.4.0 data migration.
 *
 * This is the **StartOS layout** migration: it converts what 0.3.5.1 left on
 * disk into the layout the 0.4.0 package expects — Postgres cluster location,
 * `config.yaml` → `config.php`, and file permissions. It is driven by the
 * package version graph and runs at most once, on the first update away from
 * `32.0.11:0`.
 *
 * Do not confuse it with the **upstream application** upgrade in
 * [`../init/bootstrapNextcloud.ts`](../init/bootstrapNextcloud.ts), which runs
 * Nextcloud's own `occ upgrade` whenever the bundled Nextcloud release is newer
 * than the deployed one. The two are independent and answer to different
 * triggers, but both run during init, in that order — `versionGraph` precedes
 * `bootstrapNextcloud` in `sdk.setupInit`, so everything here has finished
 * before the upstream upgrade starts.
 */

import { T, YAML } from '@start9labs/start-sdk'
import { readFile, rm, stat } from 'fs/promises'
import { cp } from 'node:fs/promises'
import { resetAdmin } from '../actions/maintenance/resetAdmin'
import { configPhp } from '../fileModels/config.php'
import { storeJson } from '../fileModels/store.json'
import { i18n } from '../i18n'
import { sdk } from '../sdk'
import {
  NEXTCLOUD_PATH,
  NEXTCLOUD_VOLUME_HOST,
  PGDATA,
  POSTGRES_PATH,
  nextcloudMount,
} from '../utils'

const POSTGRES_VOLUME_HOST = '/media/startos/volumes/db' as const
const START9_PATH = '/media/startos/volumes/main/start9' as const

/**
 * Structural view of the `PhaseHandle` returned by a migration's
 * `progress.addPhase` — the SDK bundles `@start9labs/start-core` as a nested
 * dependency, so the type itself isn't importable from a package.
 */
type ProgressPhase = {
  setUnits(units: 'steps'): void
  setDone(done: number): void
}

/**
 * Progress tracker handed to `migrations.up`. Only `addPhase` is used here.
 */
type MigrationProgress = {
  addPhase(
    name: string,
    contribution?: number | null,
  ): ProgressPhase & { start(): void; complete(): void }
}

const exists = (p: string) =>
  stat(p).then(
    () => true,
    () => false,
  )

/**
 * Where a Postgres cluster may be found, relative to the `db` volume root:
 * `data` if a previous run already relocated it, `17/main` or `15/main` if it
 * is still in the 0.3.5x Debian layout.
 */
const PG_LOCATIONS = ['data', '17/main', '15/main'] as const

/**
 * The location of the real cluster, or `null` if there isn't one.
 *
 * Identified by `PG_VERSION`, never by the directory existing. The Postgres
 * entrypoint runs `mkdir -p "$PGDATA"` in `docker_create_db_directories`
 * *before* it checks whether the database is initialized and bails, so every
 * start against an unmigrated volume leaves an empty `data/` behind. Both
 * guards here used to test for the directory, so that empty directory read as
 * "already relocated": the move was skipped, the migration reported success,
 * and it deleted the 0.3.5x marker on its way out — disarming itself while the
 * cluster was never moved.
 */
const findCluster = async (): Promise<(typeof PG_LOCATIONS)[number] | null> => {
  for (const loc of PG_LOCATIONS) {
    if (await exists(`${POSTGRES_VOLUME_HOST}/${loc}/PG_VERSION`)) return loc
  }
  return null
}

/** True if this instance holds Nextcloud application data worth preserving. */
const hasNextcloudData = () =>
  exists(`${NEXTCLOUD_VOLUME_HOST}/config/config.php`)

const relocatePostgresFrom035x = async (
  effects: T.Effects,
  from: (typeof PG_LOCATIONS)[number],
) => {
  if (from === 'data') return // already in the canonical location

  const pgMounts = sdk.Mounts.of().mountVolume({
    volumeId: 'db',
    mountpoint: POSTGRES_PATH,
    readonly: false,
    subpath: null,
  })

  await sdk.SubContainer.withTemp(
    effects,
    { imageId: 'postgres' },
    pgMounts,
    'pg-migrate',
    async (sub) => {
      // Move the cluster from the 0.3.5x Debian layout to the canonical Docker
      // path. `from` is known to hold a real cluster, and PGDATA is known not
      // to — the caller established both via PG_VERSION.
      //
      // rmdir, not rm -rf: PGDATA here is the empty shell the Postgres
      // entrypoint leaves behind, and rmdir refuses to remove a directory with
      // anything in it. If some future state puts real content there, this
      // fails loudly rather than deleting a database.
      await sub.exec(['rmdir', PGDATA], { user: 'root' })
      await sub.execFail(['mv', `${POSTGRES_PATH}/${from}`, PGDATA], {
        user: 'root',
      })
      await sub.execFail(
        ['rm', '-rf', `${POSTGRES_PATH}/${from.split('/')[0]}`],
        {
          user: 'root',
        },
      )
      await sub.execFail(['chown', '-R', 'postgres:postgres', POSTGRES_PATH], {
        user: 'root',
      })
      await sub.exec(['rm', '-f', `${PGDATA}/postmaster.pid`], {
        user: 'postgres',
      })
    },
  )
}

type OldConfig = {
  'default-locale': string
  'default-phone-region': string
  maintenance_window_start: number
}

const importConfigFrom035x = async (effects: T.Effects, config: OldConfig) => {
  await cp(configPhp.path, `${configPhp.path}.bak`)

  await configPhp.merge(effects, {
    default_locale: config['default-locale'],
    default_phone_region: config['default-phone-region'],
    maintenance_window_start: config.maintenance_window_start,
    'overwrite.cli.url': undefined,
    'htaccess.RewriteBase': undefined,
  })

  const adminPassword: string | undefined = (
    await readFile(`${START9_PATH}/password.dat`, 'utf-8').catch(
      () => undefined,
    )
  )?.trim()
  if (adminPassword) {
    await storeJson.merge(effects, { adminPassword })
  } else {
    await sdk.action.createOwnTask(effects, resetAdmin, 'critical', {
      reason: i18n(
        'Admin password could not be recovered from migration. Please reset it.',
      ),
    })
  }
}

const repairPermissionsFrom035x = async (
  effects: T.Effects,
  phase: ProgressPhase,
) => {
  await sdk.SubContainer.withTemp(
    effects,
    { imageId: 'nextcloud' },
    nextcloudMount,
    'upgrade-sub',
    async (sub) => {
      // Fix permissions on Nextcloud app files (everything except data/).
      // In 0.3.5.1, the upstream Docker entrypoint set group=root. In 0.4.0,
      // the group is www-data. We need ug+rw so the owner and group can
      // read/write, and o-rwx so other users (including dependent services
      // not in the www-data group) cannot access app internals.
      // The data/ directory is excluded here and handled separately below.
      await sub.execFail(
        [
          'find',
          NEXTCLOUD_PATH,
          '-path',
          `${NEXTCLOUD_PATH}/data`,
          '-prune',
          '-o',
          '-exec',
          'chmod',
          'ug+rw,o-rwx',
          '{}',
          '+',
        ],
        { user: 'root' },
      )
      // occ must be executable for Nextcloud CLI operations
      await sub.execFail(['chmod', 'u+x', `${NEXTCLOUD_PATH}/occ`], {
        user: 'root',
      })

      // Fix permissions on user data files (data/).
      //
      // The data directory can be enormous (2TB+), so we cannot use a single
      // recursive find or chmod -R — both accumulate inode metadata for the
      // entire tree in memory and get OOM-killed (SIGKILL) in the
      // memory-constrained migration subcontainer.
      //
      // Strategy: walk the directory tree from TypeScript, processing one
      // directory at a time. For each directory:
      //   1. find -maxdepth 1 -print0 | xargs -0 -n 5000 chmod ...
      //      Streams the immediate children through xargs in batches of 5000,
      //      so neither find nor chmod ever holds more than one directory's
      //      listing in memory.
      //   2. find -maxdepth 1 -mindepth 1 -type d -print0
      //      Lists only the immediate subdirectories so we can recurse into
      //      them one at a time. Uses -print0 / split('\0') to handle
      //      filenames with spaces or special characters.
      //
      // This keeps peak memory proportional to the largest single directory,
      // not the total file count.
      //
      // Progress is a bare count of directories processed, with no total:
      // establishing a total means a second full metadata walk of the tree,
      // which on a multi-terabyte instance costs about as much as the work
      // itself. A count that keeps climbing answers the question the user
      // actually has — is this alive — without paying for a percentage.
      // Reported on the same 100-directory cadence as the log line, since every
      // update pushes to the OS and this loop runs many times a second.
      let dirCount = 0
      phase.setUnits('steps')
      const chmodDir = async (dir: string) => {
        dirCount++
        if (dirCount % 100 === 0) {
          console.info(
            `chmod migration: processed ${dirCount} directories, current: ${dir}`,
          )
          phase.setDone(dirCount)
        }
        await sub.execFail(
          [
            'sh',
            '-c',
            `find "$1" -maxdepth 1 -print0 | xargs -0 -n 5000 chmod ug+rw,o-rwx`,
            '_',
            dir,
          ],
          { user: 'root' },
        )
        const { stdout } = await sub.execFail(
          [
            'find',
            dir,
            '-maxdepth',
            '1',
            '-mindepth',
            '1',
            '-type',
            'd',
            '-print0',
          ],
          { user: 'root' },
        )
        const subdirs = stdout
          .toString()
          .split('\0')
          .filter((s) => s.length > 0)
        for (const subdir of subdirs) {
          await chmodDir(subdir)
        }
      }
      await chmodDir(`${NEXTCLOUD_PATH}/data`)
      phase.setDone(dirCount)
    },
  )
}

/**
 * Relocate PGDATA from a previous 0.4.0 beta's path (`17/docker` → `data`).
 * Independent of the 0.3.5x work above — a beta tester has no `config.yaml`.
 */
const relocatePostgresFromBeta = async (effects: T.Effects) => {
  // Same PG_VERSION test as findCluster, and for the same reason: keying off
  // the directory would both miss the real cluster and let `mv` run against an
  // existing PGDATA, which moves the source *inside* it (data/docker) rather
  // than into place.
  if (!(await exists(`${POSTGRES_VOLUME_HOST}/17/docker/PG_VERSION`))) return
  if (await exists(`${POSTGRES_VOLUME_HOST}/data/PG_VERSION`)) return

  const pgMounts = sdk.Mounts.of().mountVolume({
    volumeId: 'db',
    subpath: null,
    mountpoint: POSTGRES_PATH,
    readonly: false,
  })
  await sdk.SubContainer.withTemp(
    effects,
    { imageId: 'postgres' },
    pgMounts,
    'pg-relocate',
    async (sub) => {
      await sub.exec(['rmdir', PGDATA], { user: 'root' })
      await sub.execFail(['mv', `${POSTGRES_PATH}/17/docker`, PGDATA], {
        user: 'root',
      })
      await sub.execFail(['rm', '-rf', `${POSTGRES_PATH}/17`], {
        user: 'root',
      })
    },
  )
}

/**
 * The migration body for `current`'s `migrations.up`. A no-op on an instance
 * that never ran on 0.3.5x, apart from the beta PGDATA relocation.
 */
export const migrateFrom035x = async (
  effects: T.Effects,
  progress: MigrationProgress,
) => {
  // config.yaml on the main volume is the 0.3.5x marker.
  const configYaml: OldConfig | undefined = await readFile(
    `${START9_PATH}/config.yaml`,
    'utf-8',
  ).then(YAML.parse, () => undefined)

  if (configYaml) {
    // Refuse to go any further without a real cluster to migrate. Everything
    // below this point is destructive-by-omission: it rewrites config, walks
    // the whole data tree, and finally deletes the 0.3.5x marker, after which
    // this migration can never run again. Completing any of that without
    // having moved a database is how an instance ends up permanently
    // un-migratable.
    const cluster = await findCluster()
    if (!cluster) {
      throw new Error(
        (await hasNextcloudData())
          ? 'Nextcloud could not find its PostgreSQL database. Your files are still on disk and are not affected, but without the database Nextcloud cannot start, and the update cannot continue. Restore this service from a StartOS backup. Do NOT uninstall the package — that would delete your files as well.'
          : 'This Nextcloud package was configured on StartOS 0.3.5x but never started, so there is no data to migrate to 0.4.0. Please uninstall the Nextcloud package and reinstall it to set up a fresh 0.4.0 install.',
      )
    }
    await relocatePostgresFrom035x(effects, cluster)
    await importConfigFrom035x(effects, configYaml)
    // Weighted far above the steps around it: on a large instance this walk
    // runs for hours while everything else here takes seconds. Without a phase
    // the update UI sat on an unmoving bar for the whole run, which reads as a
    // hang — and users cancelled, which is how an instance ends up
    // half-migrated.
    const permissions = progress.addPhase(
      i18n('Updating file permissions'),
      100,
    )
    permissions.start()
    await repairPermissionsFrom035x(effects, permissions)
    permissions.complete()
    await rm(START9_PATH, { recursive: true })
    // Remove stale config.php keys from 0.3.5.1
    await configPhp.merge(effects, {
      'overwrite.cli.url': undefined,
      'htaccess.RewriteBase': undefined,
    })
  }

  await relocatePostgresFromBeta(effects)
}
