import { VersionInfo, IMPOSSIBLE } from '@start9labs/start-sdk'

// The graph's floor: Nextcloud upgrades one major at a time, so 32 must take a 33 release first.
export const v_33_0_5_0 = VersionInfo.of({
  version: '33.0.5:0',
  releaseNotes: '',
  migrations: {
    up: IMPOSSIBLE,
    down: IMPOSSIBLE,
  },
})
