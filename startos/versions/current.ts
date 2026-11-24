import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '35.0.3:5',
  releaseNotes: {
    en_US:
      'The bundled PostgreSQL database and Valkey cache accept connections from Nextcloud alone.',
    es_ES:
      'La base de datos PostgreSQL y la caché Valkey incluidas solo aceptan conexiones de Nextcloud.',
    de_DE:
      'Die mitgelieferte PostgreSQL-Datenbank und der Valkey-Cache nehmen nur Verbindungen von Nextcloud an.',
    pl_PL:
      'Dołączona baza danych PostgreSQL i pamięć podręczna Valkey przyjmują połączenia wyłącznie od Nextcloud.',
    fr_FR:
      "La base de données PostgreSQL et le cache Valkey intégrés n'acceptent les connexions que de Nextcloud.",
  },
  migrations: {
    up: async () => {},
    down: IMPOSSIBLE,
  },
})
