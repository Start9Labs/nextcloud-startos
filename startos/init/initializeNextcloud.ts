import { getAdminCredentials } from '../actions/getAdminCredentials'
import { i18n } from '../i18n'
import { sdk } from '../sdk'
import {
  getBaseDaemons,
  getNextcloudSub,
  getPostgresSub,
  getValkeySub,
  getNextcloudEnv,
  getPostgresEnv,
  getRandomPassword,
} from '../utils'
import { storeJson } from '../fileModels/store.json'

export const initializeNextcloud = sdk.setupOnInit(async (effects, kind) => {
  if (kind !== 'install') return

  const adminPassword = getRandomPassword()
  const postgresPassword = getRandomPassword()

  await storeJson.write(effects, { adminPassword })

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
          const status = await nextcloudSub.execFail(['php', 'occ', 'status'], {
            user: 'www-data',
          })

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
    .runUntilSuccess(600_000)

  await sdk.action.createOwnTask(effects, getAdminCredentials, 'critical', {
    reason: i18n(
      'Set the admin password so you can administer your Nextcloud instance',
    ),
  })
})
