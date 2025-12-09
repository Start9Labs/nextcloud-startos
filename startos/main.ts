import { chmod, writeFile } from 'fs/promises'
import { storeJson } from './fileModels/store.json'
import { sdk } from './sdk'
import { uiPort, NEXTCLOUD_PATH as NEXTCLOUD_PATH, mainMounts } from './utils'
import { FileHelper } from '@start9labs/start-sdk'
import { configPhp } from './fileModels/config.php'

export const main = sdk.setupMain(async ({ effects, started }) => {
  /**
   * ======================== Setup ========================
   */
  console.info('Starting Nextcloud...')

  // get interface details
  const uiInterface = await sdk.serviceInterface.getOwn(effects, 'ui').const()
  if (!uiInterface) throw new Error('interfaces do not exist')
  const hostnames = uiInterface?.addressInfo?.filter({}, 'hostname-info')
  await configPhp.merge(effects, {
    trusted_proxies: ['10.0.3.0/24'],
    trusted_domains: [
      'localhost',
      ...(hostnames?.map((h) => h.hostname.value) ?? []),
    ],
  })

  let subcontainer = await sdk.SubContainer.of(
    effects,
    { imageId: 'nextcloud' },
    mainMounts,
    'nextcloud-sub',
  )

  /**
   * ======================== Daemons ========================
   */
  return sdk.Daemons.of(effects, started)
    .addOneshot('chown', {
      subcontainer,
      exec: { command: ['chown', '-R', 'www-data:www-data', '/var/www/html'] },
      requires: [],
    })
    .addDaemon('nextcloud', {
      subcontainer,
      exec: {
        command: sdk.useEntrypoint(),
        runAsInit: true,
        env: {
          CONFIG_FILE: '/var/www/html/config/config.php',
          NEXTCLOUD_PATH,
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
})
