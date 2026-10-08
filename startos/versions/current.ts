import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '35.0.1:1',
  releaseNotes: {
    en_US: `- Disable Maintenance Mode, Repair and Scan Files ask for confirmation before running.
- The Office Suite, Delete Files in Trash and External Storage settings explain what each choice does.
- Reset Admin Password offers only members of Nextcloud's admin group.
- The Delete Files in Trash choices are translated.`,
    es_ES: `- Desactivar modo de mantenimiento, Reparar y Escanear archivos piden confirmación antes de ejecutarse.
- Los ajustes Suite ofimática, Eliminar los archivos de la papelera y Almacenamiento externo explican qué hace cada opción.
- Restablecer contraseña de administrador solo ofrece miembros del grupo admin de Nextcloud.
- Las opciones de Eliminar los archivos de la papelera están traducidas.`,
    de_DE: `- Wartungsmodus deaktivieren, Reparieren und Dateien scannen fragen vor der Ausführung nach einer Bestätigung.
- Die Einstellungen Office-Suite, Dateien im Papierkorb löschen und Externer Speicher erklären, was jede Auswahl bewirkt.
- Admin-Passwort zurücksetzen bietet nur Mitglieder der Nextcloud-Gruppe admin an.
- Die Auswahlmöglichkeiten von Dateien im Papierkorb löschen sind übersetzt.`,
    pl_PL: `- Wyłącz tryb konserwacji, Napraw i Skanuj pliki proszą o potwierdzenie przed uruchomieniem.
- Ustawienia Pakiet biurowy, Usuwanie plików z kosza i Magazyn zewnętrzny wyjaśniają, co oznacza każdy wybór.
- Resetuj hasło administratora oferuje tylko członków grupy admin w Nextcloud.
- Opcje ustawienia Usuwanie plików z kosza są przetłumaczone.`,
    fr_FR: `- Désactiver le mode maintenance, Réparer et Scanner les fichiers demandent une confirmation avant de s'exécuter.
- Les réglages Suite bureautique, Suppression des fichiers de la corbeille et Stockage externe expliquent l'effet de chaque choix.
- Réinitialiser le mot de passe administrateur ne propose que les membres du groupe admin de Nextcloud.
- Les choix de Suppression des fichiers de la corbeille sont traduits.`,
  },
  migrations: {
    up: async () => {},
    down: IMPOSSIBLE,
  },
})
