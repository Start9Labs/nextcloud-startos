import { VersionInfo, T, IMPOSSIBLE } from '@start9labs/start-sdk'
import { i18n } from '../../i18n'
import { sdk } from '../../sdk'
import { readFile, rm } from 'fs/promises'
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
      // Guard: ensure PG 15→17 upgrade completed in 0.3.x before proceeding
      const { exitCode } = await sub.exec(
        ['test', '-d', `${POSTGRES_PATH}/17/main`],
        { user: 'root' },
      )
      if (exitCode !== 0) {
        throw new Error(
          'PostgreSQL 17 data not found. Please start Nextcloud 31 on StartOS 0.3.5x to complete the PG 15→17 upgrade, then retry.',
        )
      }

      // Move PG data from NC 31 Debian path (17/main) to Docker canonical path (data)
      await sub.execFail(['mv', `${POSTGRES_PATH}/17/main`, PGDATA], {
        user: 'root',
      })
      await sub.execFail(
        [
          'rm',
          '-rf',
          `${POSTGRES_PATH}/17`,
          `${POSTGRES_PATH}/15`,
          `${POSTGRES_PATH}/.pg17_upgrade_complete`,
        ],
        { user: 'root' },
      )
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

export const v32_0_5_0_b0 = VersionInfo.of({
  version: '32.0.5:0-beta.0',
  releaseNotes: {
    en_US: `- Updated to Nextcloud 32.0.5\n- Migrated from StartOS 0.3.x architecture to 0.4.0\n- Note: Ensure you've upgraded to Nextcloud 31 on StartOS 0.3.5x before upgrading to this version`,
    es_ES: `- Actualizado a Nextcloud 32.0.5\n- Migrado de la arquitectura StartOS 0.3.x a 0.4.0\n- Nota: Asegúrese de haber actualizado a Nextcloud 31 en StartOS 0.3.5x antes de actualizar a esta versión`,
    de_DE: `- Aktualisiert auf Nextcloud 32.0.5\n- Von StartOS 0.3.x-Architektur auf 0.4.0 migriert\n- Hinweis: Stellen Sie sicher, dass Sie auf Nextcloud 31 unter StartOS 0.3.5x aktualisiert haben, bevor Sie auf diese Version aktualisieren`,
    pl_PL: `- Zaktualizowano do Nextcloud 32.0.5\n- Zmigrowano z architektury StartOS 0.3.x na 0.4.0\n- Uwaga: Upewnij się, że zaktualizowałeś do Nextcloud 31 na StartOS 0.3.5x przed aktualizacją do tej wersji`,
    fr_FR: `- Mis à jour vers Nextcloud 32.0.5\n- Migration de l'architecture StartOS 0.3.x vers 0.4.0\n- Remarque : Assurez-vous d'avoir mis à jour vers Nextcloud 31 sur StartOS 0.3.5x avant de passer à cette version`,
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
    },
    down: IMPOSSIBLE,
  },
})
