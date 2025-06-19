import { VersionInfo, IMPOSSIBLE } from '@start9labs/start-sdk'
import { storeJson } from '../../fileModels/store.json'
import { readFile } from 'fs/promises'
import { load } from 'js-yaml'

export const v_30_0_11_1 = VersionInfo.of({
  version: '30.0.11:1',
  releaseNotes: 'Updated for StartOS v0.4.0',
  migrations: {
    up: async ({ effects }) => {
      const { webdav, maintenance_window_start, 'default-phone-region': phoneRegion, 'default-locale': locale } = load(
        await readFile(
          '/media/startos/volumes/main/start9/config.yaml',
          'utf-8',
        ),
      ) as {
        webdav: {
          'max-upload-file-size-limit': number
        }
        maintenance_window_start: number
        'default-phone-region':
          | 'US'
          | 'GB'
          | 'CN'
          | 'ES'
          | 'MX'
          | 'IN'
          | 'BR'
          | 'RU'
          | 'JP'
          | 'DE'
          | 'FR'
          | 'PL'
        'default-locale':
          | 'en_US'
          | 'en_GB'
          | 'zh'
          | 'es'
          | 'es_419'
          | 'hi'
          | 'pt'
          | 'ru'
          | 'ja'
          | 'de'
          | 'fr'
          | 'pl'
      }
      await storeJson.write(effects, { maxBodySize: webdav['max-upload-file-size-limit'], phoneRegion, locale, maintenanceWindowStart: maintenance_window_start })
    },
    down: IMPOSSIBLE,
  },
})
