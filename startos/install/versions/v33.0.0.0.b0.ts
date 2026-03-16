import { VersionInfo, T, IMPOSSIBLE } from '@start9labs/start-sdk'
import { i18n } from '../../i18n'
import { sdk } from '../../sdk'
import { readFile, rm, stat } from 'fs/promises'
import { configPhp } from '../../fileModels/config.php'
import { storeJson } from '../../fileModels/store.json'
import {
  nextcloudMount,
  NEXTCLOUD_PATH,
  POSTGRES_PATH,
  PGDATA,
  POSTGRES_USER,
  POSTGRES_DB,
  getRandomPassword,
} from '../../utils'
import { cp } from 'node:fs/promises'
import YAML from 'yaml'
import { resetAdmin } from '../../actions/resetAdmin'

const migratePostgres = async (effects: T.Effects): Promise<string> => {
  const pgMounts = sdk.Mounts.of().mountVolume({
    volumeId: 'db',
    mountpoint: POSTGRES_PATH,
    readonly: false,
    subpath: null,
  })

  const newPassword = getRandomPassword()

  await sdk.SubContainer.withTemp(
    effects,
    { imageId: 'postgres' },
    pgMounts,
    'pg-migrate',
    async (sub) => {
      // Move PG data from NC 31 Debian path (17/main) to Docker canonical path (data)
      await sub.execFail(['mv', `${POSTGRES_PATH}/17/main`, PGDATA], {
        user: 'root',
      })
      await sub.execFail(['rm', '-rf', `${POSTGRES_PATH}/17`], {
        user: 'root',
      })
      await sub.execFail(['chown', '-R', 'postgres:postgres', POSTGRES_PATH], {
        user: 'root',
      })

      // Start PG, change password, stop PG
      await sub.execFail(
        ['pg_ctl', 'start', '-D', PGDATA, '-w', '-o', '-c listen_addresses='],
        { user: 'postgres' },
      )
      await sub.execFail(
        [
          'psql',
          '-U',
          POSTGRES_USER,
          '-d',
          POSTGRES_DB,
          '-c',
          `ALTER USER ${POSTGRES_USER} WITH PASSWORD '${newPassword}'`,
        ],
        { user: 'postgres' },
      )
      await sub.execFail(['pg_ctl', 'stop', '-D', PGDATA, '-w'], {
        user: 'postgres',
      })
    },
  )

  return newPassword
}

type OldConfig = {
  'default-locale': string
  'default-phone-region': string
  maintenance_window_start: number
}

const migrateConfig = async (
  effects: T.Effects,
  config: OldConfig,
  newDbPassword: string,
) => {
  await cp(configPhp.path, `${configPhp.path}.bak`)

  await configPhp.merge(effects, {
    dbpassword: newDbPassword,
    default_locale: config['default-locale'],
    default_phone_region: config['default-phone-region'],
    maintenance_window_start: config.maintenance_window_start,
  })

  const adminPassword: string | undefined = await readFile(
    '/media/startos/volumes/main/start9/password.dat',
    'utf-8',
  ).catch(() => undefined)
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
      await sub.execFail(['chmod', '-R', 'ug+rw', NEXTCLOUD_PATH], {
        user: 'root',
      })
      await sub.execFail(['chmod', 'u+x', `${NEXTCLOUD_PATH}/occ`], {
        user: 'root',
      })
      await sub.execFail(['chmod', '-R', 'o-rwx', NEXTCLOUD_PATH], {
        user: 'root',
      })
    },
  )
}

export const v_33_0_0_0_b0 = VersionInfo.of({
  version: '33.0.0:0-beta.0',
  releaseNotes: {
    en_US: 'Update Nextcloud to 33.0.0',
  },
  migrations: {
    up: async ({ effects }) => {
      const configYamlPath = '/media/startos/volumes/main/start9/config.yaml'

      // Only run 0.3.5x → 0.4.0 migration if config.yaml exists (0.3.5x marker)
      const configYaml: OldConfig | undefined = await readFile(
        configYamlPath,
        'utf-8',
      ).then(YAML.parse, () => undefined)

      if (configYaml) {
        const newDbPassword = await migratePostgres(effects)
        await migrateConfig(effects, configYaml, newDbPassword)
        await migrateNextcloud(effects)
        await rm(configYamlPath)
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
            await sub.execFail(
              ['mv', `${POSTGRES_PATH}/17/docker`, PGDATA],
              { user: 'root' },
            )
            await sub.execFail(
              ['rm', '-rf', `${POSTGRES_PATH}/17`],
              { user: 'root' },
            )
          },
        )
      }

      // Merge config.php to apply new schema defaults (memcache, redis, etc.)
      await configPhp.merge(effects, {})
    },
    down: IMPOSSIBLE,
  },
})
