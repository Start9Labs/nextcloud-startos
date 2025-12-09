import { Effects } from '@start9labs/start-sdk/base/lib/Effects'
import { sdk } from './sdk'

export const uiPort = 80
export const NEXTCLOUD_PATH = '/var/www/html'

export const mainMounts = sdk.Mounts.of().mountVolume({
  volumeId: 'nextcloud',
  mountpoint: NEXTCLOUD_PATH,
  readonly: false,
  subpath: null,
})

// export const PGDATA = '/var/lib/postgresql/15/main'
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
}
export const phoneRegion = {
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
}
export const storeDefaults = {
  maxBodySize: 1024,
  locale: 'en_US' as keyof typeof locales,
  phoneRegion: 'US' as keyof typeof phoneRegion,
  maintenanceWindowStart: 24,
}

export async function getPrimaryInterfaceUrls(
  effects: Effects,
): Promise<string[]> {
  const httpInterface = await sdk.serviceInterface.getOwn(effects, 'ui').const()

  return httpInterface?.addressInfo?.urls || []
}

export function getHttpOnionUrl(urls: string[]): string {
  return urls.find((u) => u.startsWith('http:') && u.includes('.onion')) || ''
}
