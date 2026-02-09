import { sdk } from './sdk'
import { i18n } from './i18n'
import {
  uiPort,
  getNextcloudEnv,
  getPostgresEnv,
  getNextcloudSub,
  getPostgresSub,
  getValkeySub,
  getBaseDaemons,
} from './utils'
import { configPhp } from './fileModels/config.php'

export const main = sdk.setupMain(async ({ effects }) => {
  /**
   * ======================== Setup ========================
   */
  console.info(i18n('Starting Nextcloud...'))

  // get interface details
  const hostnames = await sdk.serviceInterface
    .getOwn(effects, 'ui', (u) => u?.addressInfo?.format('hostname-info') || [])
    .const()

  await configPhp.merge(effects, {
    trusted_domains: [
      'localhost',
      ...(hostnames?.map((h) => h.hostname.value) ?? []),
    ],
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
  ).addDaemon('nextcloud', {
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
})
