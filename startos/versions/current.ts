import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'
import { migrateFrom035x } from './from035x'

export const current = VersionInfo.of({
  version: '33.0.6:3',
  releaseNotes: {
    en_US: `Adds File Browser External Storage integration and repackages Nextcloud on start-sdk 2.0 (bundled image updated to Nextcloud 33.0.6 — upstream security and bug fixes).

**External Storage**

- New action to surface File Browser's shared storage as a folder in your Files, scoped per Nextcloud user — so you can move files into Nextcloud.

**Upgrades**

- Nextcloud version upgrades now run during the update step, so a failed upgrade rolls back cleanly instead of leaving the app in need of manual recovery.

**Fixes**

- Fixed a bug where background network changes on the server could put Nextcloud into a restart loop.
- Fixed a bug in the StartOS 0.3.5.x migration that could skip relocating the PostgreSQL database while still reporting success — leaving Nextcloud unable to start, and the migration unable to run again. It now verifies the database before changing anything, and stops with a clear explanation if it cannot find one.
- The update now reports progress while migrating an instance from StartOS 0.3.5.x. On a large instance that step walks every file to correct its permissions and can run for hours; it previously showed no movement at all, which looked like a hung update.

Internal updates (start-sdk 2.0).

Full changelog: https://github.com/nextcloud-releases/server/releases/tag/v33.0.6`,
    es_ES: `Añade la integración de Almacenamiento externo de File Browser y reempaqueta Nextcloud sobre start-sdk 2.0 (imagen incluida actualizada a Nextcloud 33.0.6 — correcciones de seguridad y de errores upstream).

**Almacenamiento externo**

- Nueva acción para mostrar el almacenamiento compartido de File Browser como una carpeta en tus Archivos, por usuario de Nextcloud, para que puedas mover archivos a Nextcloud.

**Actualizaciones de versión**

- Las actualizaciones de versión de Nextcloud ahora se ejecutan durante el paso de actualización, de modo que una actualización fallida se revierte limpiamente en lugar de dejar la aplicación en un estado que requiere recuperación manual.

**Correcciones**

- Corregido un error por el que cambios de red en segundo plano en el servidor podían poner Nextcloud en un bucle de reinicios.
- Corregido un error en la migración desde StartOS 0.3.5.x que podía omitir el traslado de la base de datos PostgreSQL informando aun así de que había funcionado, dejando Nextcloud sin poder arrancar y la migración sin poder volver a ejecutarse. Ahora se verifica la base de datos antes de modificar nada y se detiene con una explicación clara si no la encuentra.
- La actualización ahora informa del progreso al migrar una instancia desde StartOS 0.3.5.x. En una instancia grande, ese paso recorre todos los archivos para corregir sus permisos y puede tardar horas; antes no mostraba ningún avance, lo que parecía una actualización bloqueada.

Actualizaciones internas (start-sdk 2.0).

Registro de cambios completo: https://github.com/nextcloud-releases/server/releases/tag/v33.0.6`,
    de_DE: `Fügt die File-Browser-Integration „Externer Speicher" hinzu und stellt Nextcloud auf start-sdk 2.0 um (mitgeliefertes Image auf Nextcloud 33.0.6 aktualisiert — Sicherheits- und Fehlerkorrekturen im Upstream).

**Externer Speicher**

- Neue Aktion, um den gemeinsamen Speicher von File Browser als Ordner in Dateien anzuzeigen — pro Nextcloud-Benutzer, sodass Sie Dateien nach Nextcloud verschieben können.

**Versions-Upgrades**

- Nextcloud-Versions-Upgrades laufen jetzt während des Update-Schritts, sodass ein fehlgeschlagenes Upgrade sauber zurückgerollt wird, statt die App in einem Zustand zu hinterlassen, der manuelle Wiederherstellung erfordert.

**Fehlerkorrekturen**

- Ein Fehler wurde behoben, durch den Netzwerkänderungen im Hintergrund auf dem Server Nextcloud in eine Neustart-Schleife versetzen konnten.
- Ein Fehler in der Migration von StartOS 0.3.5.x wurde behoben, durch den das Verschieben der PostgreSQL-Datenbank übersprungen werden konnte, während trotzdem Erfolg gemeldet wurde — sodass Nextcloud nicht mehr starten konnte und die Migration nicht erneut lief. Sie prüft die Datenbank jetzt, bevor etwas geändert wird, und bricht mit einer klaren Erklärung ab, wenn keine gefunden wird.
- Die Aktualisierung meldet jetzt den Fortschritt, während eine Instanz von StartOS 0.3.5.x migriert wird. Bei einer großen Instanz durchläuft dieser Schritt jede Datei, um ihre Berechtigungen zu korrigieren, und kann Stunden dauern; zuvor war überhaupt kein Fortschritt sichtbar, was wie eine hängende Aktualisierung wirkte.

Interne Aktualisierungen (start-sdk 2.0).

Vollständige Änderungsliste: https://github.com/nextcloud-releases/server/releases/tag/v33.0.6`,
    pl_PL: `Dodaje integrację Magazynu zewnętrznego z File Browser i przenosi Nextcloud na start-sdk 2.0 (dołączony obraz zaktualizowany do Nextcloud 33.0.6 — poprawki bezpieczeństwa i błędów w upstreamie).

**Magazyn zewnętrzny**

- Nowa akcja udostępniająca współdzieloną przestrzeń File Browser jako folder w aplikacji Pliki, per użytkownik Nextcloud, dzięki czemu możesz przenosić pliki do Nextcloud.

**Aktualizacje wersji**

- Aktualizacje wersji Nextcloud są teraz wykonywane podczas kroku aktualizacji, dzięki czemu nieudana aktualizacja jest czysto wycofywana, zamiast pozostawiać aplikację w stanie wymagającym ręcznego przywracania.

**Poprawki**

- Naprawiono błąd, przez który zmiany sieci w tle na serwerze mogły wprowadzić Nextcloud w pętlę restartów.
- Naprawiono błąd w migracji ze StartOS 0.3.5.x, który mógł pominąć przeniesienie bazy danych PostgreSQL, mimo to zgłaszając powodzenie — przez co Nextcloud nie mógł się uruchomić, a migracja nie mogła zostać powtórzona. Teraz baza danych jest weryfikowana przed jakąkolwiek zmianą, a w razie jej braku migracja zatrzymuje się z jasnym wyjaśnieniem.
- Aktualizacja pokazuje teraz postęp podczas migracji instancji ze StartOS 0.3.5.x. W dużej instancji ten krok przechodzi przez każdy plik, aby poprawić jego uprawnienia, i może trwać godzinami; wcześniej nie pokazywał żadnego postępu, co wyglądało jak zawieszona aktualizacja.

Aktualizacje wewnętrzne (start-sdk 2.0).

Pełny dziennik zmian: https://github.com/nextcloud-releases/server/releases/tag/v33.0.6`,
    fr_FR: `Ajoute l'intégration Stockage externe de File Browser et repackage Nextcloud sur start-sdk 2.0 (image fournie mise à jour vers Nextcloud 33.0.6 — correctifs de sécurité et de bogues en amont).

**Stockage externe**

- Nouvelle action pour afficher le stockage partagé de File Browser comme un dossier dans Fichiers, par utilisateur Nextcloud, afin de pouvoir déplacer des fichiers vers Nextcloud.

**Mises à niveau de version**

- Les mises à niveau de version de Nextcloud s'exécutent désormais pendant l'étape de mise à jour, de sorte qu'une mise à niveau échouée est annulée proprement au lieu de laisser l'application dans un état nécessitant une récupération manuelle.

**Correctifs**

- Correction d'un bogue où des changements réseau en arrière-plan sur le serveur pouvaient placer Nextcloud dans une boucle de redémarrages.
- Correction d'un bogue dans la migration depuis StartOS 0.3.5.x qui pouvait ignorer le déplacement de la base de données PostgreSQL tout en signalant une réussite — laissant Nextcloud incapable de démarrer et la migration incapable de s'exécuter à nouveau. Elle vérifie désormais la base de données avant toute modification et s'arrête avec une explication claire si elle n'en trouve pas.
- La mise à jour indique désormais la progression lors de la migration d'une instance depuis StartOS 0.3.5.x. Sur une grande instance, cette étape parcourt chaque fichier pour corriger ses permissions et peut durer des heures ; auparavant elle n'affichait aucune progression, ce qui ressemblait à une mise à jour bloquée.

Mises à jour internes (start-sdk 2.0).

Journal des modifications complet : https://github.com/nextcloud-releases/server/releases/tag/v33.0.6`,
  },
  migrations: {
    up: ({ effects, progress }) => migrateFrom035x(effects, progress),
    down: IMPOSSIBLE,
  },
})
