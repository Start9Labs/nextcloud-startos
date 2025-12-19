import { VersionInfo, IMPOSSIBLE } from '@start9labs/start-sdk'
// import { storeJson } from '../../fileModels/store.json'

export const v_31_0_12_0_alpha_0 = VersionInfo.of({
  version: '31.0.12:0-alpha.0',
  releaseNotes: 'Updated for StartOS v0.4.0',
  migrations: {
    // up: async ({ effects }) => {
    //   // @TODO migrate from 0351, including postgres update
    //   await storeJson.write(effects, {})
    // },
    up: IMPOSSIBLE,
    down: IMPOSSIBLE,
  },
})
