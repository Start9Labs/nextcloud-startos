import { VersionInfo, IMPOSSIBLE } from '@start9labs/start-sdk'
import { storeJson } from '../../fileModels/store.json'
import { load } from 'js-yaml'

export const v_32_0_2_0_alpha_0 = VersionInfo.of({
  version: '32.0.2:0-alpha.0',
  releaseNotes: 'Updated for StartOS v0.4.0',
  migrations: {
    up: async ({ effects }) => {
      // @TODO migrate from 0351, including postgres update
      await storeJson.write(effects, {})
    },
    down: IMPOSSIBLE,
  },
})
