import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '35.0.2:0',
  releaseNotes: {
    en_US:
      'Updated Nextcloud to 35.0.2. Fixes remembered login sessions, share permissions and expiration defaults, and preservation of external-storage mount options. Full release notes: https://nextcloud.com/changelog/#35-0-2',
    es_ES:
      'Nextcloud actualizado a 35.0.2. Corrige las sesiones de inicio de sesión recordadas, los permisos y la caducidad predeterminada de los recursos compartidos, y la conservación de las opciones de montaje del almacenamiento externo. Notas completas: https://nextcloud.com/changelog/#35-0-2',
    de_DE:
      'Nextcloud auf 35.0.2 aktualisiert. Behebt Fehler bei gespeicherten Anmeldesitzungen, Freigabeberechtigungen und voreingestellten Ablaufzeiten sowie beim Erhalt der Einbindungsoptionen externer Speicher. Vollständige Versionshinweise: https://nextcloud.com/changelog/#35-0-2',
    pl_PL:
      'Zaktualizowano Nextcloud do 35.0.2. Naprawiono zapamiętane sesje logowania, uprawnienia i domyślne terminy wygaśnięcia udostępnień oraz zachowywanie opcji montowania pamięci zewnętrznej. Pełne informacje o wydaniu: https://nextcloud.com/changelog/#35-0-2',
    fr_FR:
      'Nextcloud mis à jour vers 35.0.2. Corrige les sessions de connexion mémorisées, les autorisations et les délais d’expiration par défaut des partages, ainsi que la conservation des options de montage du stockage externe. Notes complètes : https://nextcloud.com/changelog/#35-0-2',
  },
  migrations: {
    up: async () => {},
    down: IMPOSSIBLE,
  },
})
