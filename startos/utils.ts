import { sdk } from './sdk'
import { T, utils } from '@start9labs/start-sdk'

export const uiPort = 80 as const
export const NEXTCLOUD_PATH = '/var/www/html' as const
export const POSTGRES_PATH = '/var/lib/postgresql' as const

export const nextcloudMount = sdk.Mounts.of().mountVolume({
  volumeId: 'nextcloud',
  mountpoint: NEXTCLOUD_PATH,
  readonly: false,
  subpath: null,
})

export const POSTGRES_DB = 'nextcloud'
export const POSTGRES_USER = 'nextcloud'
export const PGDATA = `${POSTGRES_PATH}/data`

export function getPostgresEnv() {
  return {
    POSTGRES_DB,
    POSTGRES_USER,
    PGDATA,
  }
}

export function getNextcloudEnv(
  postgresEnv: Record<string, string>,
) {
  return {
    ...postgresEnv,
    PHP_MEMORY_LIMIT: '1024M',
    PHP_UPLOAD_LIMIT: '20480M',
    POSTGRES_HOST: 'localhost',
  }
}

export const locales = {
  en_US: 'English (US)',
  en_GB: 'English (GB)',
  zh: 'Chinese',
  es: 'Spanish',
  es_419: 'Spanish (LA)',
  hi: 'Hindi',
  pt: 'Portuguese',
  ru: 'Russian',
  ja: 'Japanese',
  de: 'German',
  fr: 'French',
  pl: 'Polish',
} as const

export const phoneRegions = {
  US: 'United States',
  GB: 'United Kingdom',
  CN: 'China',
  ES: 'Spain',
  MX: 'Mexico',
  IN: 'India',
  BR: 'Brazil',
  RU: 'Russia',
  JP: 'Japan',
  DE: 'Germany',
  FR: 'France',
  PL: 'Poland',
} as const

export const configDefaults = {
  default_local: 'en_US',
  default_phone_region: 'US',
  maintenance_window_start: 24,
  trusted_proxies: ['10.0.3.0/24'],
  'memcache.local': '\\OC\\Memcache\\APCu',
  'memcache.distributed': '\\OC\\Memcache\\Redis',
  'memcache.locking': '\\OC\\Memcache\\Redis',
  redis: {
    host: 'localhost',
    port: 6379,
  },
  updatechecker: false,
  check_for_working_wellknown_setup: true,
  'filelocking.enabled': true,
  'integrity.check.disabled': true,
} as const

export function getValkeySub(effects: T.Effects) {
  return sdk.SubContainer.of(
    effects,
    { imageId: 'valkey' },
    sdk.Mounts.of(),
    'valkey',
  )
}

export function getNextcloudSub(effects: T.Effects) {
  return sdk.SubContainer.of(
    effects,
    { imageId: 'nextcloud' },
    nextcloudMount,
    'nextcloud-sub',
  )
}

export function getPostgresSub(effects: T.Effects) {
  return sdk.SubContainer.of(
    effects,
    { imageId: 'postgres' },
    sdk.Mounts.of().mountVolume({
      volumeId: 'db',
      mountpoint: POSTGRES_PATH,
      readonly: false,
      subpath: null,
    }),
    'postgres-sub',
  )
}

export function getBaseDaemons(
  effects: T.Effects,
  postgresSub: Awaited<ReturnType<typeof getPostgresSub>>,
  nextcloudSub: Awaited<ReturnType<typeof getNextcloudSub>>,
  valkeySub: Awaited<ReturnType<typeof getValkeySub>>,
  postgresEnv: Record<string, string>,
) {
  return sdk.Daemons.of(effects)
    .addOneshot('chown', {
      subcontainer: nextcloudSub,
      exec: {
        command: ['chown', '-R', 'www-data:www-data', NEXTCLOUD_PATH],
      },
      requires: [],
    })
    .addDaemon('postgres', {
      subcontainer: postgresSub,
      exec: {
        command: sdk.useEntrypoint(),
        env: postgresEnv,
      },
      ready: {
        display: null,
        fn: async () => {
          const { exitCode } = await postgresSub.exec([
            `pg_isready`,
            '-U',
            POSTGRES_USER,
            '-h',
            'localhost',
          ])

          if (exitCode !== 0) {
            return {
              result: 'loading',
              message: null,
            }
          }
          return {
            result: 'success',
            message: null,
          }
        },
      },
      requires: [],
    })
    .addDaemon('valkey', {
      subcontainer: valkeySub,
      exec: { command: 'valkey-server' },
      ready: {
        display: null,
        fn: async () => {
          const res = await valkeySub.exec(['valkey-cli', 'ping'])
          return res.stdout.toString().trim() === 'PONG'
            ? { message: '', result: 'success' }
            : { message: res.stdout.toString().trim(), result: 'failure' }
        },
      },
      requires: [],
    })
}

export function getRandomPassword() {
  return utils.getDefaultString({
    charset: 'a-z,A-Z,0-9',
    len: 24,
  })
}
