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

export const postgresMount = sdk.Mounts.of().mountVolume({
  volumeId: 'db',
  mountpoint: `${POSTGRES_PATH}/data`,
  readonly: false,
  subpath: null,
})

export const NEXTCLOUD_ENV = {
  CONFIG_FILE: `${NEXTCLOUD_PATH}/config/config.php`,
  NEXTCLOUD_PATH,
  POSTGRES_DB: 'nextcloud',
  POSTGRES_USER: 'nextcloud',
  POSTGRES_PASSWORD: getRandomPassword(),
  POSTGRES_HOST: 'localhost',
  PHP_USER_FILE: `${NEXTCLOUD_PATH}/.user.ini`,
  PHP_MEMORY_LIMIT: '1024M',
  PHP_UPLOAD_LIMIT: '20480M',
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
    postgresMount,
    'postgres-sub',
  )
}

export function getRandomPassword() {
  return utils.getDefaultString({
    charset: 'a-z,A-Z,0-9',
    len: 24,
  })
}
