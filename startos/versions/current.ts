import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '35.0.3:4',
  releaseNotes: {
    en_US:
      'Adds the PHP soap extension, so the Exchange Connector app can be enabled.',
    es_ES:
      'Añade la extensión soap de PHP, para que se pueda activar la aplicación Exchange Connector.',
    de_DE:
      'Fügt die PHP-Erweiterung soap hinzu, sodass sich die App Exchange Connector aktivieren lässt.',
    pl_PL:
      'Dodaje rozszerzenie PHP soap, dzięki czemu można włączyć aplikację Exchange Connector.',
    fr_FR:
      "Ajoute l'extension PHP soap, afin que l'application Exchange Connector puisse être activée.",
  },
  migrations: {
    up: async () => {},
    down: IMPOSSIBLE,
  },
})
