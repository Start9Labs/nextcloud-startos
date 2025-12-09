import { sdk } from './sdk'
import {
  uiPort,
  NEXTCLOUD_PATH,
  NEXTCLOUD_ENV,
  getNextcloudSub,
  postgresMount,
  getPostgresSub,
  POSTGRES_PATH,
} from './utils'
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

  const nextcloudSub = await getNextcloudSub(effects)
  const postgresSub = await getPostgresSub(effects)

  /**
   * ======================== Daemons ========================
   */
  return sdk.Daemons.of(effects, started)
    .addOneshot('chown-nextcloud', {
      subcontainer: nextcloudSub,
      exec: {
        command: ['chown', '-R', 'www-data:www-data', NEXTCLOUD_PATH],
      },
      requires: [],
    })
    .addOneshot('chown-postgres', {
      subcontainer: postgresSub,
      exec: {
        command: ['chown', '-R', 'postgres:postgres', POSTGRES_PATH],
      },
      requires: [],
    })
    .addDaemon('postgres', {
      subcontainer: await sdk.SubContainer.of(
        effects,
        { imageId: 'postgres' },
        postgresMount,
        'postgres-sub',
      ),
      exec: {
        command: [
          'su',
          '-c',
          `${POSTGRES_PATH}/16/bin/pg_ctl`,
          '-D',
          POSTGRES_PATH,
          'start',
        ],
      },
      ready: {
        display: null,
        fn: async () => {
          return sdk.SubContainer.withTemp(
            effects,
            { imageId: 'postgres' },
            postgresMount,
            'postgres-ready',
            async (sub) => {
              const status = await sub.execFail([
                'su',
                '-c',
                `${POSTGRES_PATH}/16/bin/pg_isready`,
                '-h',
                'localhost',
              ])
              if (status.stderr) {
                console.error(
                  'Error running postgres: ',
                  status.stderr.toString(),
                )
                return {
                  result: 'loading',
                  message: 'Waiting for PostgreSQL to be ready',
                }
              }
              return {
                result: 'success',
                message: 'Postgres is ready',
              }
            },
          )
        },
      },
      requires: ['chown-postgres'],
    })
    .addDaemon('nextcloud', {
      subcontainer: nextcloudSub,
      exec: {
        command: sdk.useEntrypoint(),
        runAsInit: true,
        env: NEXTCLOUD_ENV,
      },
      ready: {
        display: 'Web Interface',
        fn: () =>
          sdk.healthCheck.checkPortListening(effects, uiPort, {
            successMessage: 'The web interface is ready',
            errorMessage: 'The web interface is not ready',
          }),
      },
      requires: ['chown-nextcloud', 'postgres'],
    })
})
