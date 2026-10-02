import { VersionInfo, IMPOSSIBLE } from '@start9labs/start-sdk'

// The graph's floor: Nextcloud upgrades one major at a time, so 33 must take a 34 release first.
export const v_34_0_0_0 = VersionInfo.of({
  version: '34.0.0:0',
  releaseNotes: '',
  migrations: {
    up: IMPOSSIBLE,
    down: IMPOSSIBLE,
  },
})
