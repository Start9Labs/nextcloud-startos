import { matches, FileHelper } from '@start9labs/start-sdk'
import { storeDefaults } from '../utils'

const { object, number, literals, string } = matches

const { locale, maxBodySize, phoneRegion, maintenanceWindowStart } =
  storeDefaults

const shape = object({
  adminPassword: string.optional().onMismatch(undefined),
  // url: string.optional().onMismatch(undefined),
  // maxBodySize: number.onMismatch(maxBodySize),
  locale: literals(
    'en_US',
    'en_GB',
    'zh',
    'es',
    'es_419',
    'hi',
    'pt',
    'ru',
    'ja',
    'de',
    'fr',
    'pl',
  ).onMismatch(locale),
  phoneRegion: literals(
    'US',
    'GB',
    'CN',
    'ES',
    'MX',
    'IN',
    'BR',
    'RU',
    'JP',
    'DE',
    'FR',
    'PL',
  ).onMismatch(phoneRegion),
  maintenanceWindowStart: number.onMismatch(maintenanceWindowStart),
})

export const storeJson = FileHelper.json(
  {
    volumeId: 'main',
    subpath: 'store.json',
  },
  shape,
)
