import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '35.0.2:2',
  releaseNotes: {
    en_US:
      "Fixes Collabora Online's fallback connection, which the editor uses when it cannot connect the usual way.",
    es_ES:
      'Corrige la conexión alternativa de Collabora Online, que el editor usa cuando no puede conectarse de la forma habitual.',
    de_DE:
      'Behebt die Ausweichverbindung von Collabora Online, die der Editor nutzt, wenn er sich nicht auf dem üblichen Weg verbinden kann.',
    pl_PL:
      'Naprawia połączenie zapasowe Collabora Online, z którego edytor korzysta, gdy nie może połączyć się w zwykły sposób.',
    fr_FR:
      'Corrige la connexion de secours de Collabora Online, que l’éditeur utilise lorsqu’il ne peut pas se connecter de la manière habituelle.',
  },
  migrations: {
    up: async () => {},
    down: IMPOSSIBLE,
  },
})
