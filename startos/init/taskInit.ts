import { utils } from '@start9labs/start-sdk'
import { getAdminCredentials } from '../actions/getAdminCredentials'
import { sdk } from '../sdk'
import { mainMounts, NEXTCLOUD_PATH, uiPort } from '../utils'
import { storeJson } from '../fileModels/store.json'

export const taskCreateAdminUser = sdk.setupOnInit(async (effects, kind) => {
  if (kind === 'install') {
    const adminPassword = utils.getDefaultString({
      charset: 'a-z,A-Z,0-9',
      len: 24,
    })
    await storeJson.merge(effects, { adminPassword })
    const subcontainer = await sdk.SubContainer.of(
      effects,
      {
        imageId: 'nextcloud',
      },
      mainMounts,
      'nextcloud-init',
    )
    await sdk.Daemons.of(effects, async () => null)
      .addOneshot('chown', {
        subcontainer,
        exec: {
          command: ['chown', '-R', 'www-data:www-data', '/var/www/html'],
        },
        requires: [],
      })
      .addDaemon('nextcloud', {
        subcontainer,
        exec: {
          command: sdk.useEntrypoint(),
          env: {
            CONFIG_FILE: '/var/www/html/config/config.php',
            NEXTCLOUD_PATH,
            NEXTCLOUD_ADMIN_USER: 'admin',
            NEXTCLOUD_ADMIN_PASSWORD: adminPassword,
            SQLITE_DATABASE: 'nextcloud',
            PHP_USER_FILE: '/var/www/html/.user.ini',
            PHP_MEMORY_LIMIT: '1024M',
            PHP_UPLOAD_LIMIT: '20480M',
          },
        },
        ready: {
          display: 'Web Interface',
          fn: () =>
            sdk.healthCheck.checkPortListening(effects, uiPort, {
              successMessage: 'The web interface is ready',
              errorMessage: 'The web interface is not ready',
            }),
        },
        requires: ['chown'],
      })
      .addHealthCheck('installed', {
        ready: {
          fn: async () => {
            const status = await subcontainer.execFail([
              'runuser',
              '-u',
              'www-data',
              '--',
              'php',
              '/var/www/html/occ',
              'status',
            ])
            if (status.stdout.includes('installed: true')) {
              return {
                message: null,
                result: 'success',
              }
            } else {
              return {
                message: null,
                result: 'failure',
              }
            }
          },
          display: null,
        },
        requires: ['nextcloud'],
      })
      .runUntilSuccess(600_000)
    await sdk.action.createOwnTask(effects, getAdminCredentials, 'critical', {
      reason:
        'Set the admin password so you can administer your Nextcloud instance',
    })
  }
})
