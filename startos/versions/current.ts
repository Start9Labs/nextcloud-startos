import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '34.0.3:5',
  releaseNotes: {
    en_US: `Updated Nextcloud to 34.0.3 — a major upgrade from the Nextcloud 33 series.

**New in this package**

- **Office editing.** A new **Office Suite** action connects Nextcloud to Collabora Online or ONLYOFFICE Docs, both in the marketplace, so you can open and edit documents, spreadsheets and presentations in your browser and work on them with other people at the same time. Install the service and pick it in the Office Suite action; Nextcloud installs the app it needs and points itself at it. Collabora Online is recommended for almost everyone; it is the lighter of the two by far. The editor is served from your own Nextcloud address, so it works on your local network, a public domain and Tor alike.

- **Delete Files in Trash**, a new setting in the Configure action. Nextcloud keeps a deleted file for at least 30 days and then clears it only when disk space runs short, so on a server with room to spare the trash grows without bound. You can now cap it at 7 to 365 days, or keep everything.

**New in Nextcloud 34**

- A redesigned top bar: apps move into a launcher menu, and the search box sits in the middle.
- Calendars can now be shared with, and edited on, another Nextcloud server.
- Temporary file locking ships with Nextcloud. Lock a shared file while you work on it so nobody overwrites your changes.
- A new **Office** section in the navigation gathers your documents, spreadsheets and presentations on one page.
- The Files list gains filters in the top bar, a marker for recently created files, and a warning before you create a hidden file.
- Contacts can be filtered by team, and team members can be found on federated servers.

Nextcloud backported the 34.0.1–34.0.3 maintenance fixes to the 33 line as well, so coming from 33.0.8 you already have them. The features above are what this update adds.

**Worth knowing**

- If your server is still on Nextcloud 32, update to the latest Nextcloud 33 release first — open Nextcloud in the Marketplace and pick it from the version list — then update again. Nextcloud only upgrades one major version at a time, so a 32 → 34 update is refused and rolled back.
- Apps you installed yourself from the Nextcloud app store may need updates of their own. Nextcloud 34 removes several long-deprecated interfaces; an app still using them is disabled during the upgrade, or breaks the web interface. If the interface stops loading, run **Disable Non-default Apps** from the Maintenance group, then re-enable your apps one at a time.
- The update runs a database schema change, so it takes longer than a maintenance release.
- PHP moves to 8.5, the version Nextcloud 34 recommends.
- Nextcloud Desktop clients older than 3.2.50 are refused. Any client from the last few years is well past that.

**Fixed**

- On macOS and iOS, Calendar and Contacts accounts set up with just the server address (CalDAV/CardDAV autodiscovery) would add but never sync when using an HTTPS address. They now sync.
- The service could get stuck restarting and never finish starting, with nothing in the log to explain it.
- On servers migrated from StartOS 0.3.5, the personal settings page (Edit profile) returned an Internal Server Error. It opens again.

Full changelog: https://github.com/nextcloud-releases/server/releases/tag/v34.0.3`,
    es_ES: `Nextcloud actualizado a 34.0.3: una actualización mayor desde la serie 33 de Nextcloud.

**Novedades de este paquete**

- **Edición ofimática.** Una nueva acción **Suite ofimática** conecta Nextcloud con Collabora Online o con ONLYOFFICE Docs, ambos en el mercado, para que pueda abrir y editar documentos, hojas de cálculo y presentaciones en su navegador y trabajar en ellos con otras personas a la vez. Instale el servicio y elíjalo en la acción Suite ofimática; Nextcloud instala la aplicación que necesita y se apunta a ella. Se recomienda Collabora Online para casi todo el mundo; es con diferencia la más ligera de las dos. El editor se sirve desde su propia dirección de Nextcloud, así que funciona igual en su red local, en un dominio público y en Tor.

- **Eliminar los archivos de la papelera**, un nuevo ajuste en la acción Configuración. Nextcloud conserva un archivo borrado al menos 30 días y solo lo suprime cuando escasea el espacio en disco, de modo que en un servidor con espacio de sobra la papelera crece sin límite. Ahora puede limitarla de 7 a 365 días, o conservarlo todo.

**Novedades de Nextcloud 34**

- Barra superior rediseñada: las aplicaciones pasan a un menú de acceso y el cuadro de búsqueda queda en el centro.
- Los calendarios ya se pueden compartir con otro servidor Nextcloud y editarse en él.
- El bloqueo temporal de archivos viene incluido en Nextcloud. Bloquee un archivo compartido mientras trabaja en él para que nadie sobrescriba sus cambios.
- Una nueva sección **Office** en la navegación reúne sus documentos, hojas de cálculo y presentaciones en una sola página.
- La lista de Archivos incorpora filtros en la barra superior, una marca para los archivos creados recientemente y un aviso antes de crear un archivo oculto.
- Los contactos se pueden filtrar por equipo, y los miembros de un equipo se pueden buscar en servidores federados.

Nextcloud también retroportó a la serie 33 las correcciones de mantenimiento de 34.0.1 a 34.0.3, así que si viene de 33.0.8 ya las tiene. Lo que aporta esta actualización son las novedades anteriores.

**Conviene saber**

- Si su servidor sigue en Nextcloud 32, actualice primero a la última versión de Nextcloud 33 —abra Nextcloud en el Mercado y elíjala en la lista de versiones— y después vuelva a actualizar. Nextcloud solo actualiza una versión mayor cada vez, por lo que una actualización de 32 a 34 se rechaza y se revierte.
- Las aplicaciones que haya instalado usted desde la tienda de Nextcloud pueden necesitar su propia actualización. Nextcloud 34 elimina varias interfaces obsoletas desde hace tiempo; una aplicación que aún las use se desactiva durante la actualización o rompe la interfaz web. Si la interfaz deja de cargarse, ejecute **Desactivar aplicaciones no predeterminadas** en el grupo Mantenimiento y vuelva a activar sus aplicaciones una a una.
- La actualización ejecuta un cambio de esquema en la base de datos, por lo que tarda más que una versión de mantenimiento.
- PHP pasa a la versión 8.5, la recomendada por Nextcloud 34.
- Los clientes de Nextcloud Desktop anteriores a la versión 3.2.50 se rechazan. Cualquier cliente de los últimos años supera con creces esa versión.

**Correcciones**

- En macOS y iOS, las cuentas de Calendario y Contactos configuradas solo con la dirección del servidor (autodescubrimiento CalDAV/CardDAV) se añadían pero nunca sincronizaban al usar una dirección HTTPS. Ahora sincronizan.
- El servicio podía quedarse reiniciándose sin llegar nunca a arrancar, y sin ninguna explicación en el registro.
- En los servidores migrados desde StartOS 0.3.5, la página de ajustes personales (Editar perfil) devolvía un error interno del servidor. Vuelve a abrirse.

Registro de cambios completo: https://github.com/nextcloud-releases/server/releases/tag/v34.0.3`,
    de_DE: `Nextcloud auf 34.0.3 aktualisiert — ein Upgrade auf eine neue Hauptversion, ausgehend von der Nextcloud-Reihe 33.

**Neu in diesem Paket**

- **Dokumentbearbeitung.** Eine neue Aktion **Office-Suite** verbindet Nextcloud mit Collabora Online oder ONLYOFFICE Docs, beide im Marktplatz. Damit öffnen und bearbeiten Sie Dokumente, Tabellen und Präsentationen im Browser und arbeiten gemeinsam mit anderen daran. Installieren Sie den Dienst und wählen Sie ihn in der Aktion „Office-Suite“; Nextcloud installiert die benötigte App und richtet sich selbst darauf aus. Für fast alle ist Collabora Online die Empfehlung; es ist die mit Abstand leichtere der beiden. Der Editor wird über Ihre eigene Nextcloud-Adresse ausgeliefert und funktioniert dadurch im Heimnetz, über eine öffentliche Domain und über Tor gleichermaßen.

- **Dateien im Papierkorb löschen**, eine neue Einstellung in der Aktion Konfiguration. Nextcloud bewahrt eine gelöschte Datei mindestens 30 Tage auf und entfernt sie erst, wenn der Speicherplatz knapp wird — auf einem Server mit reichlich Platz wächst der Papierkorb also unbegrenzt. Sie können ihn jetzt auf 7 bis 365 Tage begrenzen oder alles behalten.

**Neu in Nextcloud 34**

- Neu gestaltete Kopfleiste: Die Apps wandern in ein Startmenü, das Suchfeld sitzt in der Mitte.
- Kalender lassen sich jetzt mit einem anderen Nextcloud-Server teilen und dort bearbeiten.
- Das temporäre Sperren von Dateien gehört zum Lieferumfang von Nextcloud. Sperren Sie eine freigegebene Datei, während Sie daran arbeiten, damit niemand Ihre Änderungen überschreibt.
- Ein neuer Bereich **Office** in der Navigation fasst Ihre Dokumente, Tabellen und Präsentationen auf einer Seite zusammen.
- Die Dateiliste erhält Filter in der Kopfleiste, eine Markierung für kürzlich erstellte Dateien und eine Warnung, bevor Sie eine versteckte Datei anlegen.
- Kontakte lassen sich nach Team filtern, und Teammitglieder können auf föderierten Servern gefunden werden.

Nextcloud hat die Wartungskorrekturen aus 34.0.1 bis 34.0.3 auch in die Reihe 33 zurückportiert; wer von 33.0.8 kommt, hat sie also bereits. Was dieses Update bringt, sind die Neuerungen oben.

**Wissenswert**

- Läuft Ihr Server noch mit Nextcloud 32, aktualisieren Sie zuerst auf die neueste Version der Reihe 33 — öffnen Sie Nextcloud im Marktplatz und wählen Sie sie in der Versionsliste aus — und aktualisieren Sie danach erneut. Nextcloud aktualisiert immer nur eine Hauptversion auf einmal; ein Update von 32 auf 34 wird daher abgelehnt und zurückgerollt.
- Selbst installierte Apps aus dem Nextcloud App Store benötigen möglicherweise ein eigenes Update. Nextcloud 34 entfernt mehrere seit Langem veraltete Schnittstellen; eine App, die sie noch nutzt, wird beim Upgrade deaktiviert oder macht die Weboberfläche unbrauchbar. Lädt die Oberfläche nicht mehr, führen Sie **Nicht-Standard-Apps deaktivieren** in der Gruppe Wartung aus und aktivieren Sie Ihre Apps anschließend einzeln wieder.
- Das Update führt eine Schemaänderung an der Datenbank durch und dauert daher länger als eine Wartungsversion.
- PHP wechselt auf 8.5, die von Nextcloud 34 empfohlene Version.
- Nextcloud-Desktop-Clients älter als 3.2.50 werden abgewiesen. Jeder Client der letzten Jahre liegt weit darüber.

**Korrekturen**

- Auf macOS und iOS wurden Kalender- und Kontakte-Konten, die nur mit der Serveradresse eingerichtet wurden (CalDAV/CardDAV-Autodiscovery), zwar hinzugefügt, synchronisierten über eine HTTPS-Adresse aber nie. Jetzt synchronisieren sie.
- Der Dienst konnte in einer Neustartschleife hängen bleiben, ohne jemals vollständig hochzufahren, und das Protokoll gab keinen Hinweis darauf.
- Auf Servern, die von StartOS 0.3.5 migriert wurden, lieferte die Seite mit den persönlichen Einstellungen (Profil bearbeiten) einen internen Serverfehler. Sie lässt sich wieder öffnen.

Vollständiges Änderungsprotokoll: https://github.com/nextcloud-releases/server/releases/tag/v34.0.3`,
    pl_PL: `Zaktualizowano Nextcloud do wersji 34.0.3 — to aktualizacja do nowej wersji głównej, wychodząca z serii 33.

**Nowości w tym pakiecie**

- **Edycja dokumentów.** Nowa akcja **Pakiet biurowy** łączy Nextcloud z Collabora Online albo z ONLYOFFICE Docs — oba są dostępne na rynku. Możesz otwierać i edytować dokumenty, arkusze i prezentacje w przeglądarce oraz pracować nad nimi razem z innymi osobami. Zainstaluj usługę i wskaż ją w akcji Pakiet biurowy; Nextcloud zainstaluje potrzebną aplikację i sam się na nią skieruje. Dla niemal wszystkich zalecana jest Collabora Online; jest zdecydowanie lżejsza z tych dwóch. Edytor jest udostępniany spod Twojego własnego adresu Nextcloud, więc działa tak samo w sieci lokalnej, pod domeną publiczną i przez Tor.

- **Usuwanie plików z kosza**, nowe ustawienie w akcji Konfiguracja. Nextcloud przechowuje usunięty plik co najmniej 30 dni i kasuje go dopiero wtedy, gdy zaczyna brakować miejsca na dysku, więc na serwerze z zapasem miejsca kosz rośnie bez ograniczeń. Teraz możesz ograniczyć go do 7–365 dni albo zachować wszystko.

**Nowości w Nextcloud 34**

- Przeprojektowany górny pasek: aplikacje trafiają do menu uruchamiania, a pole wyszukiwania znajduje się pośrodku.
- Kalendarze można teraz udostępniać innemu serwerowi Nextcloud i tam je edytować.
- Tymczasowe blokowanie plików jest częścią Nextcloud. Zablokuj udostępniony plik na czas pracy nad nim, aby nikt nie nadpisał Twoich zmian.
- Nowa sekcja **Office** w nawigacji zbiera dokumenty, arkusze i prezentacje na jednej stronie.
- Lista plików zyskuje filtry w górnym pasku, oznaczenie ostatnio utworzonych plików i ostrzeżenie przed utworzeniem pliku ukrytego.
- Kontakty można filtrować według zespołu, a członków zespołu wyszukiwać na serwerach federacyjnych.

Nextcloud przeniósł poprawki konserwacyjne z wersji 34.0.1–34.0.3 także do serii 33, więc przechodząc z 33.0.8 już je masz. Ta aktualizacja wnosi opisane wyżej nowości.

**Warto wiedzieć**

- Jeśli Twój serwer nadal działa na Nextcloud 32, zaktualizuj najpierw do najnowszego wydania z serii 33 — otwórz Nextcloud w Rynku i wybierz je z listy wersji — a potem zaktualizuj ponownie. Nextcloud aktualizuje tylko o jedną wersję główną naraz, więc aktualizacja z 32 do 34 zostanie odrzucona i wycofana.
- Aplikacje zainstalowane samodzielnie ze sklepu Nextcloud mogą wymagać własnych aktualizacji. Nextcloud 34 usuwa kilka od dawna przestarzałych interfejsów; aplikacja, która wciąż z nich korzysta, zostaje wyłączona podczas aktualizacji albo psuje interfejs webowy. Jeśli interfejs przestanie się ładować, uruchom **Wyłącz niestandardowe aplikacje** z grupy Konserwacja, a następnie włączaj swoje aplikacje pojedynczo.
- Aktualizacja wykonuje zmianę schematu bazy danych, więc trwa dłużej niż wydanie konserwacyjne.
- PHP przechodzi na wersję 8.5, zalecaną przez Nextcloud 34.
- Klienty Nextcloud Desktop starsze niż 3.2.50 są odrzucane. Każdy klient z ostatnich lat jest znacznie nowszy.

**Poprawki**

- W systemach macOS i iOS konta Kalendarza i Kontaktów skonfigurowane samym adresem serwera (autowykrywanie CalDAV/CardDAV) dawały się dodać, ale przy adresie HTTPS nigdy nie synchronizowały. Teraz synchronizują.
- Usługa mogła utknąć, wciąż się restartując i nigdy nie kończąc uruchamiania, bez żadnego wyjaśnienia w dzienniku.
- Na serwerach zmigrowanych ze StartOS 0.3.5 strona ustawień osobistych (Edytuj profil) zwracała wewnętrzny błąd serwera. Znów się otwiera.

Pełny dziennik zmian: https://github.com/nextcloud-releases/server/releases/tag/v34.0.3`,
    fr_FR: `Nextcloud mis à jour vers 34.0.3 — une mise à niveau majeure depuis la série Nextcloud 33.

**Nouveautés de ce paquet**

- **Édition bureautique.** Une nouvelle action **Suite bureautique** relie Nextcloud à Collabora Online ou à ONLYOFFICE Docs, tous deux dans la place de marché, pour ouvrir et modifier documents, feuilles de calcul et présentations dans votre navigateur, et y travailler à plusieurs simultanément. Installez le service et sélectionnez-le dans l'action Suite bureautique ; Nextcloud installe l'application nécessaire et se pointe dessus. Collabora Online est recommandé pour presque tout le monde ; c'est de loin le plus léger des deux. L'éditeur est servi depuis votre propre adresse Nextcloud : il fonctionne donc aussi bien sur votre réseau local, sur un domaine public et via Tor.

- **Suppression des fichiers de la corbeille**, un nouveau réglage dans l'action Configuration. Nextcloud conserve un fichier supprimé au moins 30 jours et ne l'efface que lorsque l'espace disque vient à manquer : sur un serveur disposant de place, la corbeille grossit donc sans limite. Vous pouvez désormais la plafonner de 7 à 365 jours, ou tout conserver.

**Nouveautés de Nextcloud 34**

- Barre supérieure repensée : les applications passent dans un menu de lancement et le champ de recherche se place au centre.
- Les agendas peuvent désormais être partagés avec un autre serveur Nextcloud et modifiés depuis celui-ci.
- Le verrouillage temporaire des fichiers est fourni avec Nextcloud. Verrouillez un fichier partagé pendant que vous y travaillez pour que personne n'écrase vos modifications.
- Une nouvelle section **Office** dans la navigation regroupe vos documents, feuilles de calcul et présentations sur une seule page.
- La liste des fichiers gagne des filtres dans la barre supérieure, un repère pour les fichiers créés récemment et un avertissement avant la création d'un fichier caché.
- Les contacts peuvent être filtrés par équipe, et les membres d'une équipe recherchés sur des serveurs fédérés.

Nextcloud a également rétroporté vers la série 33 les correctifs de maintenance de 34.0.1 à 34.0.3 : en venant de 33.0.8, vous les avez déjà. Ce que cette mise à jour apporte, ce sont les nouveautés ci-dessus.

**Bon à savoir**

- Si votre serveur est encore sous Nextcloud 32, mettez-le d'abord à niveau vers la dernière version de la série 33 — ouvrez Nextcloud dans la Place de marché et choisissez-la dans la liste des versions — puis mettez à jour de nouveau. Nextcloud ne franchit qu'une version majeure à la fois : une mise à jour de 32 vers 34 est refusée et annulée.
- Les applications que vous avez installées depuis la boutique Nextcloud peuvent nécessiter leur propre mise à jour. Nextcloud 34 supprime plusieurs interfaces obsolètes de longue date ; une application qui les utilise encore est désactivée pendant la mise à niveau, ou casse l'interface web. Si l'interface ne se charge plus, lancez **Désactiver les applications non standard** dans le groupe Maintenance, puis réactivez vos applications une par une.
- La mise à jour effectue une modification du schéma de la base de données ; elle prend donc plus de temps qu'une version de maintenance.
- PHP passe à la version 8.5, celle que Nextcloud 34 recommande.
- Les clients Nextcloud Desktop antérieurs à 3.2.50 sont refusés. Tout client des dernières années est bien au-delà.

**Correctifs**

- Sur macOS et iOS, les comptes Calendrier et Contacts configurés avec la seule adresse du serveur (autodécouverte CalDAV/CardDAV) s'ajoutaient mais ne se synchronisaient jamais via une adresse HTTPS. Ils se synchronisent désormais.
- Le service pouvait rester bloqué à redémarrer sans jamais finir de se lancer, sans aucune explication dans le journal.
- Sur les serveurs migrés depuis StartOS 0.3.5, la page des paramètres personnels (Modifier le profil) renvoyait une erreur interne du serveur. Elle s'ouvre de nouveau.

Journal des modifications complet : https://github.com/nextcloud-releases/server/releases/tag/v34.0.3`,
  },
  migrations: {
    up: async () => {},
    down: IMPOSSIBLE,
  },
})
