import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '35.0.2:6',
  releaseNotes: {
    en_US:
      'Connecting Coturn now requires Coturn 4.18.0:6 or later, and ONLYOFFICE Docs 10.0.0:1 or later.',
    es_ES:
      'Conectar Coturn ahora requiere Coturn 4.18.0:6 o posterior, y ONLYOFFICE Docs 10.0.0:1 o posterior.',
    de_DE:
      'Die Anbindung von Coturn erfordert jetzt Coturn 4.18.0:6 oder neuer, und ONLYOFFICE Docs 10.0.0:1 oder neuer.',
    pl_PL:
      'Połączenie z Coturn wymaga teraz Coturn 4.18.0:6 lub nowszego, a ONLYOFFICE Docs 10.0.0:1 lub nowszego.',
    fr_FR:
      'La connexion à Coturn nécessite désormais Coturn 4.18.0:6 ou une version ultérieure, et ONLYOFFICE Docs 10.0.0:1 ou une version ultérieure.',
  },
  migrations: {
    up: async () => {},
    down: IMPOSSIBLE,
  },
})
