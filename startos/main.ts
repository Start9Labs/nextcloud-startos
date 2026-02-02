import { sdk } from './sdk'
import { i18n } from './i18n'
import {
  uiPort,
  NEXTCLOUD_ENV,
  getNextcloudSub,
  getPostgresSub,
  getBaseDaemons,
} from './utils'
import { configPhp } from './fileModels/config.php'

export const main = sdk.setupMain(async ({ effects }) => {
  /**
   * ======================== Setup ========================
   */
  console.info(i18n('Starting Nextcloud...'))

  // get interface details
  const uiInterface = await sdk.serviceInterface.getOwn(effects, 'ui').const()
  if (!uiInterface) throw new Error('interfaces do not exist')
  const hostnames = uiInterface?.addressInfo?.format('hostname-info')
  await configPhp.merge(effects, {
    trusted_proxies: ['10.0.3.0/24'],
    trusted_domains: [
      'localhost',
      ...(hostnames?.map((h) => h.hostname.value) ?? []),
    ],
  })

  const nextcloudSub = await getNextcloudSub(effects)
  const postgresSub = await getPostgresSub(effects)

  /**
   * ======================== Daemons ========================
   */
  return getBaseDaemons(effects, postgresSub, nextcloudSub).addDaemon(
    'nextcloud',
    {
      subcontainer: nextcloudSub,
      exec: {
        command: sdk.useEntrypoint(),
        env: NEXTCLOUD_ENV,
      },
      ready: {
        display: i18n('Web Interface'),
        fn: () =>
          sdk.healthCheck.checkPortListening(effects, uiPort, {
            successMessage: i18n('The web interface is ready'),
            errorMessage: i18n('The web interface is not ready'),
          }),
      },
      requires: ['chown', 'postgres'],
    },
  )
})
