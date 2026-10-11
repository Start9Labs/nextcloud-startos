import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '35.0.1:3',
  releaseNotes: {
    en_US: `- Nextcloud starts faster on servers holding many files.`,
    es_ES: `- Nextcloud se inicia más rápido en servidores con muchos archivos.`,
    de_DE: `- Nextcloud startet schneller auf Servern mit vielen Dateien.`,
    pl_PL: `- Nextcloud uruchamia się szybciej na serwerach z dużą liczbą plików.`,
    fr_FR: `- Nextcloud démarre plus vite sur les serveurs contenant de nombreux fichiers.`,
  },
  migrations: {
    up: async () => {},
    down: IMPOSSIBLE,
  },
})
