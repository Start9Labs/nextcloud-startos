import { configPhp } from './fileModels/config.php'
import { i18n } from './i18n'
import { sdk } from './sdk'
import {
  getBaseDaemons,
  getNextcloudEnv,
  getNextcloudSub,
  getPostgresEnv,
  getPostgresSub,
  getValkeySub,
  nextcloudMount,
  uiPort,
} from './utils'

export const main = sdk.setupMain(async ({ effects }) => {
  /**
   * ======================== Setup ========================
   */
  console.info(i18n('Starting Nextcloud...'))

  // get interface details
  const hostnameInfo = await sdk.serviceInterface
    .getOwn(
      effects,
      'ui',
      (u) =>
        u?.addressInfo
          ?.filter({
            exclude: { kind: ['link-local', 'bridge'] },
          })
          .format('hostname-info') || [],
    )
    .const()

  await configPhp.merge(effects, {
    trusted_domains: hostnameInfo.map((h) =>
      h.metadata.kind === 'ipv6' ? `[${h.hostname}]` : h.hostname,
    ),
  })

  const nextcloudSub = await getNextcloudSub(effects)
  const valkeySub = await getValkeySub(effects)
  const postgresEnv = getPostgresEnv()

  /**
   * ======================== Daemons ========================
   */
  return getBaseDaemons(
    effects,
    await getPostgresSub(effects),
    nextcloudSub,
    valkeySub,
    postgresEnv,
  )
    .addDaemon('nextcloud', {
      subcontainer: nextcloudSub,
      exec: {
        command: sdk.useEntrypoint(),
        env: getNextcloudEnv(postgresEnv),
      },
      ready: {
        display: i18n('Web Interface'),
        fn: () =>
          sdk.healthCheck.checkPortListening(effects, uiPort, {
            successMessage: i18n('The web interface is ready'),
            errorMessage: i18n('The web interface is not ready'),
          }),
      },
      requires: ['chown', 'postgres', 'valkey'],
    })
    .addDaemon('cron', {
      subcontainer: await sdk.SubContainer.of(
        effects,
        { imageId: 'nextcloud' },
        nextcloudMount,
        'nextcloud-cron',
      ),
      exec: {
        command: ['/cron.sh'],
        env: getNextcloudEnv(postgresEnv),
      },
      ready: {
        display: null,
        fn: async () => ({ result: 'success', message: null }),
      },
      requires: ['nextcloud'],
    })
})
