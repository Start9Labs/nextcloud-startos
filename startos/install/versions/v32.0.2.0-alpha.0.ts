import { VersionInfo, IMPOSSIBLE } from '@start9labs/start-sdk'
import { storeJson } from '../../fileModels/store.json'
import { readFile } from 'fs/promises'
import { load } from 'js-yaml'
import { locales, phoneRegion as phoneRegionType } from '../../utils'

export const v_32_0_2_0_alpha_0 = VersionInfo.of({
  version: '32.0.2:0-alpha.0',
  releaseNotes: 'Updated for StartOS v0.4.0',
  migrations: {
    up: async ({ effects }) => {
      const {
        webdav,
        maintenance_window_start,
        'default-phone-region': phoneRegion,
        'default-locale': locale,
      } = load(
        await readFile(
          '/media/startos/volumes/main/start9/config.yaml',
          'utf-8',
        ),
      ) as {
        webdav: {
          'max-upload-file-size-limit': number
        }
        maintenance_window_start: number
        'default-phone-region': keyof typeof phoneRegionType
        'default-locale': keyof typeof locales
      }
      await storeJson.write(effects, {
        // maxBodySize: webdav['max-upload-file-size-limit'],
        phoneRegion,
        locale,
        maintenanceWindowStart: maintenance_window_start,
      })
    },
    down: IMPOSSIBLE,
  },
})
