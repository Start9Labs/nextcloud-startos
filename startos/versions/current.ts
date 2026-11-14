import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '35.0.3:0',
  releaseNotes: {
    en_US:
      'Updated Nextcloud to 35.0.3, a maintenance release. Fixes include share expiration times being preserved, readable passwords in share-by-mail emails, more reliable CalDAV and CardDAV sync, and uploads of files with no MIME type, along with faster preview generation. Full notes: https://github.com/nextcloud-releases/server/releases/tag/v35.0.3',
    es_ES:
      'Nextcloud actualizado a 35.0.3, una versión de mantenimiento. Las correcciones incluyen que se conserva la hora de caducidad de los recursos compartidos, contraseñas legibles en los correos de compartir por correo, una sincronización CalDAV y CardDAV más fiable y la subida de archivos sin tipo MIME, además de una generación de vistas previas más rápida. Notas completas: https://github.com/nextcloud-releases/server/releases/tag/v35.0.3',
    de_DE:
      'Nextcloud auf 35.0.3 aktualisiert, ein Wartungsrelease. Zu den Korrekturen gehören, dass die Ablaufzeit von Freigaben erhalten bleibt, lesbare Passwörter in E-Mails zur Freigabe per E-Mail, zuverlässigere CalDAV- und CardDAV-Synchronisierung und das Hochladen von Dateien ohne MIME-Typ, dazu eine schnellere Vorschaugenerierung. Vollständige Hinweise: https://github.com/nextcloud-releases/server/releases/tag/v35.0.3',
    pl_PL:
      'Zaktualizowano Nextcloud do wersji 35.0.3, wydania konserwacyjnego. Poprawki obejmują zachowywanie czasu wygaśnięcia udostępnień, czytelne hasła w wiadomościach udostępniania przez e-mail, bardziej niezawodną synchronizację CalDAV i CardDAV oraz przesyłanie plików bez typu MIME, a także szybsze generowanie podglądów. Pełne informacje: https://github.com/nextcloud-releases/server/releases/tag/v35.0.3',
    fr_FR:
      "Mise à jour de Nextcloud vers 35.0.3, une version de maintenance. Les corrections incluent la conservation de l'heure d'expiration des partages, des mots de passe lisibles dans les e-mails de partage par e-mail, une synchronisation CalDAV et CardDAV plus fiable et l'envoi de fichiers sans type MIME, ainsi qu'une génération d'aperçus plus rapide. Notes complètes : https://github.com/nextcloud-releases/server/releases/tag/v35.0.3",
  },
  migrations: {
    up: async () => {},
    down: IMPOSSIBLE,
  },
})
