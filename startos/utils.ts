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

export const POSTGRES_ENV = {
  POSTGRES_DB: 'nextcloud',
  POSTGRES_USER: 'nextcloud',
  POSTGRES_PASSWORD: getRandomPassword(),
  PGDATA: `${POSTGRES_PATH}/17/docker`,
}

export const NEXTCLOUD_ENV = {
  ...POSTGRES_ENV,
  PHP_MEMORY_LIMIT: '1024M',
  PHP_UPLOAD_LIMIT: '20480M',
  POSTGRES_HOST: 'localhost',
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
} as const

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
        env: POSTGRES_ENV,
      },
      ready: {
        display: null,
        fn: async () => {
          const { exitCode } = await postgresSub.exec([
            `pg_isready`,
            '-U',
            POSTGRES_ENV.POSTGRES_USER,
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
}

export function getRandomPassword() {
  return utils.getDefaultString({
    charset: 'a-z,A-Z,0-9',
    len: 24,
  })
}
