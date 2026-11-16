import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '35.0.3:2',
  releaseNotes: {
    en_US:
      'Changes to Talk Calls, Office Suite or External Storage made while Post-Update Maintenance or Repair is running now apply once it finishes.',
    es_ES:
      'Los cambios en Llamadas de Talk, Suite ofimática o Almacenamiento externo realizados mientras se ejecuta Mantenimiento posterior a la actualización o Reparar ahora se aplican cuando termina.',
    de_DE:
      'Änderungen an Talk-Anrufe, Office-Suite oder Externer Speicher, die während Wartung nach dem Update oder Reparieren vorgenommen werden, werden jetzt angewendet, sobald dies abgeschlossen ist.',
    pl_PL:
      'Zmiany w ustawieniach Połączenia Talk, Pakiet biurowy lub Magazyn zewnętrzny wprowadzone podczas Konserwacji po aktualizacji lub Naprawy są teraz stosowane po jej zakończeniu.',
    fr_FR:
      "Les modifications d'Appels Talk, de Suite bureautique ou de Stockage externe effectuées pendant Maintenance post-mise à jour ou Réparer s'appliquent désormais une fois celle-ci terminée.",
  },
  migrations: {
    up: async () => {},
    down: IMPOSSIBLE,
  },
})
