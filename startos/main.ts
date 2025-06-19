import { writeFile } from 'fs/promises'
import { storeJson } from './fileModels/store.json'
import { sdk } from './sdk'
import { getNginxFile, uiPort } from './utils'

export const main = sdk.setupMain(async ({ effects, started }) => {
  /**
   * ======================== Setup (optional) ========================
   */
  console.info('Starting Nextcloud...')

  // Configure nginx
  const maxBodySize = await storeJson.read(s => s.maxBodySize).const(effects)
  await writeFile('/etc/nginx/conf.d/default.conf', getNginxFile(maxBodySize!))
  

  /**
   * ======================== Daemons ========================
   */
  return sdk.Daemons.of(effects, started).addDaemon('primary', {
    subcontainer: await sdk.SubContainer.of(
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
    ),
    exec: {
      command: ['/scripts/nextcloud-run.sh'],
      env: {
        LAN_ADDRESS: '', // @TODO get lan
        TOR_ADDRESS: '', // @TODO get tor
        SERVICE_ADDRESS: 'nextcloud.startos',
        MAINTENANCE_WINDOW_START: '', //@TODO get maintenance_window_start from config
        TRUSTED_PROXIES: '10.0.3.0/24',
        NEXTCLOUD_TRUSTED_DOMAINS:
          "$TOR_ADDRESS $LAN_ADDRESS $SERVICE_ADDRESS $(yq e '.extra-addresses[]' /root/start9/config.yaml | tr '\n' ' ')", //@TODO fix
        CONFIG_FILE: '/var/www/html/config/config.php',
        PGDATA: '/var/lib/postgresql/15/main',
        NEXTCLOUD_PATH: '/var/www/html',
        NEXTCLOUD_ADMIN_USER: 'admin',
        PASSWORD_FILE: '/root/start9/password.dat', // @TODO copy from start9 in migration
        INITIALIZED_FILE: '/root/initialized',
        STARTOS_CONFIG_FILE: '/root/start9/config.yaml',
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
