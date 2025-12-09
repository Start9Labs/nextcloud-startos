import { getAdminCredentials } from '../actions/getAdminCredentials'
import { sdk } from '../sdk'
import {
  getNextcloudSub,
  getPostgresSub,
  getRandomPassword,
  NEXTCLOUD_ENV,
  NEXTCLOUD_PATH,
  POSTGRES_MOUNTPOINT,
  POSTGRES_PATH,
  postgresMount,
  uiPort,
} from '../utils'
import { storeJson } from '../fileModels/store.json'

export const initializeNextcloud = sdk.setupOnInit(async (effects, kind) => {
  if (kind !== 'install') return

  const adminPassword = getRandomPassword()

  await storeJson.write(effects, { adminPassword })

  const nextcloudSub = await getNextcloudSub(effects)
  const postgresSub = await getPostgresSub(effects)

  await sdk.Daemons.of(effects, async () => null)
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
    .addOneshot('init-postgres', {
      subcontainer: postgresSub,
      exec: {
        command: [
          'su',
          '-c',
          `${POSTGRES_PATH}/16/bin/pg_ctl`,
          'initdb',
          '-D',
          POSTGRES_MOUNTPOINT,
          'postgres',
        ],
      },
      requires: ['chown-postgres'],
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
          'start',
          '-D',
          POSTGRES_MOUNTPOINT,
          'postgres',
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
      requires: ['init-postgres'],
    })
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
        fn: () =>
          sdk.healthCheck.checkPortListening(effects, uiPort, {
            successMessage: '',
            errorMessage: '',
          }),
      },
      requires: ['chown-nextcloud', 'postgres'],
    })
    .addHealthCheck('installed', {
      ready: {
        display: null,
        fn: async () => {
          const status = await nextcloudSub.execFail([
            'runuser',
            '-u',
            'www-data',
            '--',
            'php',
            `${NEXTCLOUD_PATH}/occ`,
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
      },
      requires: ['nextcloud'],
    })
    .runUntilSuccess(600_000)

  await sdk.action.createOwnTask(effects, getAdminCredentials, 'critical', {
    reason:
      'Set the admin password so you can administer your Nextcloud instance',
  })
})
