import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '35.0.2:3',
  releaseNotes: {
    en_US:
      "Nextcloud's missing database indices and file type migrations are applied in the background after every update and by the Repair action, so administration settings no longer warn about them.",
    es_ES:
      'Tras cada actualización, los índices de base de datos que faltan y las migraciones de tipos de archivo de Nextcloud se aplican en segundo plano, y la acción Reparar también los aplica. Esto elimina esos avisos en la configuración de administración.',
    de_DE:
      'Nach jedem Update werden fehlende Datenbankindizes und Dateityp-Migrationen von Nextcloud im Hintergrund angewendet, und auch die Aktion Reparieren wendet sie an. Damit verschwinden diese Warnungen in den Verwaltungseinstellungen.',
    pl_PL:
      'Po każdej aktualizacji brakujące indeksy bazy danych i migracje typów plików Nextcloud są stosowane w tle, a akcja Napraw również je stosuje. Usuwa to te ostrzeżenia w ustawieniach administracyjnych.',
    fr_FR:
      'Après chaque mise à jour, les index de base de données manquants et les migrations de types de fichiers de Nextcloud sont appliqués en arrière-plan, et l’action Réparer les applique également. Cela fait disparaître ces avertissements dans les paramètres d’administration.',
  },
  migrations: {
    up: async () => {},
    down: IMPOSSIBLE,
  },
})
