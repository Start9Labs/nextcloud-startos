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

export const v_32_0_6_2_b6 = VersionInfo.of({
  version: '32.0.6:2-beta.6',
  releaseNotes: {
    en_US: `- Fix backups: use pg_dump instead of raw volume rsync for database, exclude regenerable application files`,
    es_ES: `- Corregir copias de seguridad: usar pg_dump en lugar de rsync de volumen para la base de datos, excluir archivos de aplicación regenerables`,
    de_DE: `- Backups reparieren: pg_dump statt Volumen-rsync für die Datenbank verwenden, regenerierbare Anwendungsdateien ausschließen`,
    pl_PL: `- Naprawa kopii zapasowych: użycie pg_dump zamiast rsync wolumenu dla bazy danych, wykluczenie regenerowalnych plików aplikacji`,
    fr_FR: `- Corriger les sauvegardes : utiliser pg_dump au lieu de rsync de volume pour la base de données, exclure les fichiers d'application régénérables`,
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
        await relocatePostgres(effects)
        await migrateConfig(effects, configYaml)
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
            await sub.execFail(['mv', `${POSTGRES_PATH}/17/docker`, PGDATA], {
              user: 'root',
            })
            await sub.execFail(['rm', '-rf', `${POSTGRES_PATH}/17`], {
              user: 'root',
            })
          },
        )
      }

      // Merge config.php to apply new schema defaults (memcache, redis, etc.)
      await configPhp.merge(effects, {})
    },
    down: IMPOSSIBLE,
  },
})
