import { VersionInfo, IMPOSSIBLE } from '@start9labs/start-sdk'

// The oldest published Nextcloud 33 revision, and the floor of this package's
// version graph: `up: IMPOSSIBLE` is what stops `canMigrateFrom` reaching below
// it. Nextcloud upgrades one major at a time, so an install on Nextcloud 32
// cannot reach the 34 bundled here — it has to take a 33 release first.
export const v_33_0_5_0 = VersionInfo.of({
  version: '33.0.5:0',
  releaseNotes: '',
  migrations: {
    up: IMPOSSIBLE,
    down: IMPOSSIBLE,
  },
})
