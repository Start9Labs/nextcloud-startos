import { IMPOSSIBLE, T, VersionInfo, YAML } from '@start9labs/start-sdk'
import { readFile, rm, stat } from 'fs/promises'
import { cp } from 'node:fs/promises'
import { resetAdmin } from '../actions/resetAdmin'
import { configPhp } from '../fileModels/config.php'
import { storeJson } from '../fileModels/store.json'
import { i18n } from '../i18n'
import { sdk } from '../sdk'
import { NEXTCLOUD_PATH, PGDATA, POSTGRES_PATH, nextcloudMount } from '../utils'

const relocatePostgres = async (effects: T.Effects) => {
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
      // Relocate PG data from 0.3.5x Debian path (17/main) to Docker path (data).
      // If a previous migration attempt succeeded here but failed later,
      // data/ already exists and 17/main is gone. Skip the move in that case.
      const { exitCode } = await sub.exec(['test', '-d', PGDATA])
      if (exitCode !== 0) {
        await sub.execFail(['mv', `${POSTGRES_PATH}/17/main`, PGDATA], {
          user: 'root',
        })
        await sub.execFail(['rm', '-rf', `${POSTGRES_PATH}/17`], {
          user: 'root',
        })
      }
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

const migrateConfig = async (effects: T.Effects, config: OldConfig) => {
  await cp(configPhp.path, `${configPhp.path}.bak`)

  await configPhp.merge(effects, {
    default_locale: config['default-locale'],
    default_phone_region: config['default-phone-region'],
    maintenance_window_start: config.maintenance_window_start,
    'overwrite.cli.url': undefined,
    'htaccess.RewriteBase': undefined,
  })

  const adminPassword: string | undefined = (
    await readFile(
      '/media/startos/volumes/main/start9/password.dat',
      'utf-8',
    ).catch(() => undefined)
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

const migrateNextcloud = async (effects: T.Effects) => {
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
      let dirCount = 0
      const chmodDir = async (dir: string) => {
        dirCount++
        if (dirCount % 100 === 0) {
          console.info(`chmod migration: processed ${dirCount} directories, current: ${dir}`)
        }
        await sub.execFail(
          ['sh', '-c', `find "$1" -maxdepth 1 -print0 | xargs -0 -n 5000 chmod ug+rw,o-rwx`, '_', dir],
          { user: 'root' },
        )
        const { stdout } = await sub.execFail(
          ['find', dir, '-maxdepth', '1', '-mindepth', '1', '-type', 'd', '-print0'],
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
    },
  )
}

export const v_32_0_8_0 = VersionInfo.of({
  version: '32.0.8:0',
  releaseNotes: {
    en_US: 'Update Nextcloud to 32.0.8',
    es_ES: 'Actualización de Nextcloud a 32.0.8',
    de_DE: 'Update von Nextcloud auf 32.0.8',
    pl_PL: 'Aktualizacja Nextcloud do 32.0.8',
    fr_FR: 'Mise à jour de Nextcloud vers 32.0.8',
  },
  migrations: {
    up: async ({ effects }) => {
      const start9Path = '/media/startos/volumes/main/start9'

      // Only run 0.3.5x → 0.4.0 migration if config.yaml exists (0.3.5x marker)
      const configYaml: OldConfig | undefined = await readFile(
        `${start9Path}/config.yaml`,
        'utf-8',
      ).then(YAML.parse, () => undefined)

      if (configYaml) {
        await relocatePostgres(effects)
        await migrateConfig(effects, configYaml)
        await migrateNextcloud(effects)
        await rm(start9Path, { recursive: true })
        // Remove stale config.php keys from 0.3.5.1
        await configPhp.merge(effects, {
          'overwrite.cli.url': undefined,
          'htaccess.RewriteBase': undefined,
        })
      }

      // Previous 0.4.0 beta: relocate PGDATA (17/docker → data)
      const OLD_PGDATA_HOST = '/media/startos/volumes/db/17/docker'
      const oldPgdataExists = await stat(OLD_PGDATA_HOST).then(
        () => true,
        () => false,
      )
      if (oldPgdataExists) {
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
          'pg-relocate',
          async (sub) => {
            await sub.execFail(['mv', `${POSTGRES_PATH}/17/docker`, PGDATA], {
              user: 'root',
            })
            await sub.execFail(['rm', '-rf', `${POSTGRES_PATH}/17`], {
              user: 'root',
            })
          },
        )
      }
    },
    down: IMPOSSIBLE,
  },
})
