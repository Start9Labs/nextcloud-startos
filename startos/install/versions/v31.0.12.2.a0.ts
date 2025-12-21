import { VersionInfo, IMPOSSIBLE } from '@start9labs/start-sdk'
// import { storeJson } from '../../fileModels/store.json'

export const v_31_0_12_2_a0 = VersionInfo.of({
  version: '31.0.12:2-alpha.0',
  releaseNotes: 'Updated for StartOS v0.4.0',
  migrations: {
    // up: async ({ effects }) => {
    //   // @TODO migrate from 0351, including postgres update and chmod to 750/640
    //   await storeJson.write(effects, {})
    // },
    up: IMPOSSIBLE,
    down: IMPOSSIBLE,
  },
})
