import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '35.0.3:3',
  releaseNotes: {
    en_US:
      'A new Talk Calls health check says what is missing or in the way when Talk calls are set to use Coturn or Nextcloud Talk HPB.',
    es_ES:
      'Una nueva comprobación de estado, Llamadas de Talk, indica qué falta o qué lo impide cuando las llamadas de Talk están configuradas para usar Coturn o Nextcloud Talk HPB.',
    de_DE:
      'Eine neue Zustandsprüfung, Talk-Anrufe, zeigt, was fehlt oder im Weg steht, wenn Talk-Anrufe Coturn oder Nextcloud Talk HPB verwenden sollen.',
    pl_PL:
      'Nowa kontrola stanu Połączenia Talk pokazuje, czego brakuje lub co przeszkadza, gdy połączenia Talk mają korzystać z Coturn lub Nextcloud Talk HPB.',
    fr_FR:
      "Une nouvelle vérification d'état, Appels Talk, indique ce qui manque ou fait obstacle lorsque les appels Talk doivent utiliser Coturn ou Nextcloud Talk HPB.",
  },
  migrations: {
    up: async () => {},
    down: IMPOSSIBLE,
  },
})
