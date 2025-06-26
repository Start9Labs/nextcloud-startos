import { writeFile } from 'fs/promises'
import { storeJson } from './fileModels/store.json'
import { sdk } from './sdk'
import { getNginxFile, uiPort, PGDATA, NEXTCLOUD_PATH } from './utils'

export const main = sdk.setupMain(async ({ effects, started }) => {
  /**
   * ======================== Setup ========================
   */
  console.info('Starting Nextcloud...')

  const nextcloudSub = await sdk.SubContainer.of(
    effects,
    { imageId: 'nextcloud' },
    sdk.Mounts.of()
      .mountVolume({
        volumeId: 'main',
        subpath: null,
        mountpoint: '/root',
        readonly: false,
      })
      .mountAssets({
        subpath: null,
        mountpoint: '/scripts',
        type: 'directory',
      }),
    'nextcloud-sub',
  )

  // Configure nginx
  const maxBodySize = await storeJson.read((s) => s.maxBodySize).const(effects)
  await writeFile(
    `${nextcloudSub.rootfs}/etc/nginx/conf.d/default.conf`,
    getNginxFile(maxBodySize!),
  )

  // get interface details
  const uiInterface = await sdk.serviceInterface.getOwn(effects, 'ui').const()
  if (!uiInterface) throw new Error('interfaces do not exist')
  // @TODO check if need just domain or full urls
  const urls = uiInterface?.addressInfo?.urls

  /**
   * ======================== Daemons ========================
   */
  return sdk.Daemons.of(effects, started).addDaemon('nextcloud', {
    subcontainer: nextcloudSub,
    exec: {
      command: ['/scripts/nextcloud-run.sh'],
      env: {
        MAINTENANCE_WINDOW_START: String(
          await storeJson.read((s) => s.maintenanceWindowStart),
        ),
        TRUSTED_PROXIES: '10.0.3.0/24',
        NEXTCLOUD_TRUSTED_DOMAINS: urls?.join(' ')!,
        CONFIG_FILE: '/var/www/html/config/config.php',
        PGDATA,
        NEXTCLOUD_PATH,
        NEXTCLOUD_ADMIN_USER: 'admin',
        PASSWORD_FILE: '/root/start9/password.dat',
        INITIALIZED_FILE: '/root/initialized',
        PHP_USER_FILE: '/var/www/html/.user.ini',
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
    requires: [],
  })
})
