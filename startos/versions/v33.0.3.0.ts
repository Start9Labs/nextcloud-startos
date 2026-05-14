import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'

export const v_33_0_3_0 = VersionInfo.of({
  version: '33.0.3:0',
  releaseNotes: {
    en_US: `**Bumps**

- Nextcloud → 33.0.3
- start-sdk → 1.5.1`,
    es_ES: `**Cambios de versión**

- Nextcloud → 33.0.3
- start-sdk → 1.5.1`,
    de_DE: `**Versionserhöhungen**

- Nextcloud → 33.0.3
- start-sdk → 1.5.1`,
    pl_PL: `**Aktualizacje wersji**

- Nextcloud → 33.0.3
- start-sdk → 1.5.1`,
    fr_FR: `**Mises à jour**

- Nextcloud → 33.0.3
- start-sdk → 1.5.1`,
  },
  migrations: {
    up: async () => {},
    down: IMPOSSIBLE,
  },
})
