import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '34.0.4:0',
  releaseNotes: {
    en_US: `Updated Nextcloud to 34.0.4. This maintenance release fixes sharing with multiple mounts, file request uploads, notifications, Photos timestamps and trash handling, and Text synchronization conflicts.

[Full release notes](https://nextcloud.com/changelog/#34-0-4)`,
    es_ES: `Se ha actualizado Nextcloud a la versión 34.0.4. Esta versión de mantenimiento corrige el uso compartido con varios puntos de montaje, las cargas mediante solicitudes de archivos, las notificaciones, las marcas de tiempo y el manejo de la papelera en Fotos, y los conflictos de sincronización en Texto.

[Notas completas de la versión](https://nextcloud.com/changelog/#34-0-4)`,
    de_DE: `Nextcloud wurde auf 34.0.4 aktualisiert. Diese Wartungsversion behebt Fehler bei Freigaben mit mehreren Einhängepunkten, Uploads über Dateianfragen, Benachrichtigungen, Zeitstempeln und der Papierkorbverarbeitung in Fotos sowie Synchronisierungskonflikten in Text.

[Vollständige Versionshinweise](https://nextcloud.com/changelog/#34-0-4)`,
    pl_PL: `Zaktualizowano Nextcloud do wersji 34.0.4. To wydanie konserwacyjne naprawia udostępnianie z wieloma punktami montowania, przesyłanie plików przez żądania plików, powiadomienia, znaczniki czasu i obsługę kosza w Zdjęciach oraz konflikty synchronizacji w Tekście.

[Pełne informacje o wydaniu](https://nextcloud.com/changelog/#34-0-4)`,
    fr_FR: `Nextcloud a été mis à jour vers la version 34.0.4. Cette version de maintenance corrige le partage avec plusieurs points de montage, les téléversements via les demandes de fichiers, les notifications, les horodatages et la gestion de la corbeille dans Photos, ainsi que les conflits de synchronisation dans Texte.

[Notes de version complètes](https://nextcloud.com/changelog/#34-0-4)`,
  },
  migrations: {
    up: async () => {},
    down: IMPOSSIBLE,
  },
})
