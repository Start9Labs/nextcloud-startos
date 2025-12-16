import { getAdminCredentials } from '../actions/getAdminCredentials'
import { sdk } from '../sdk'
import {
  getBaseDaemons,
  getNextcloudSub,
  getPostgresSub,
  getRandomPassword,
  NEXTCLOUD_ENV,
} from '../utils'
import { storeJson } from '../fileModels/store.json'

export const initializeNextcloud = sdk.setupOnInit(async (effects, kind) => {
  if (kind !== 'install') return

  const adminPassword = getRandomPassword()

  await storeJson.write(effects, { adminPassword })

  const nextcloudSub = await getNextcloudSub(effects)
  const postgresSub = await getPostgresSub(effects)

  await getBaseDaemons(effects, postgresSub, nextcloudSub)
    .addDaemon('nextcloud', {
      subcontainer: nextcloudSub,
      exec: {
        command: sdk.useEntrypoint(),
        env: {
          ...NEXTCLOUD_ENV,
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
      requires: ['chown-nextcloud', 'postgres'],
    })
    .runUntilSuccess(600_000)

  await sdk.action.createOwnTask(effects, getAdminCredentials, 'critical', {
    reason:
      'Set the admin password so you can administer your Nextcloud instance',
  })
})
