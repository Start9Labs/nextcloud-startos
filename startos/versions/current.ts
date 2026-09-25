import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '35.0.0:0',
  releaseNotes: {
    en_US: `Updated Nextcloud to 35.0.0 — a major upgrade from the Nextcloud 34 series.

**New in Nextcloud 35**

- Sharing has a unified dialog and sidebar, with share status and clearer password and expiration guidance.
- Photos adds search, trip memories, a map, slideshows, EXIF editing and a redesigned timeline.
- Text adds inline comments and footnotes.
- Office adds document previews and navigation actions.

**Worth knowing**

- If your server is still on Nextcloud 33, install the Nextcloud 34 release from the version list first, then update again. Nextcloud upgrades only one major version at a time.
- Apps installed from the Nextcloud app store may need compatible updates and can be disabled during the upgrade.
- The update migrates the database schema, so it can take longer than a maintenance release.
- Nextcloud Desktop clients older than 3.3.50 are no longer supported.

**Fixed**

- Fixes a crash after installing or updating an app on aarch64 servers that left Nextcloud unreachable until it was restarted.
- Moving a large Nextcloud from StartOS 0.3.5 no longer fails partway through the migration.

[Full release notes](https://github.com/nextcloud-releases/server/releases/tag/v35.0.0)`,
    es_ES: `Nextcloud se ha actualizado a la versión 35.0.0, una actualización mayor desde la serie Nextcloud 34.

**Novedades de Nextcloud 35**

- El uso compartido tiene un cuadro de diálogo y una barra lateral unificados, con el estado de los recursos compartidos e indicaciones más claras sobre contraseñas y vencimiento.
- Fotos incorpora búsqueda, recuerdos de viajes, un mapa, presentaciones, edición de EXIF y una cronología rediseñada.
- Texto incorpora comentarios en línea y notas al pie.
- Office incorpora vistas previas de documentos y acciones de navegación.

**Conviene saber**

- Si su servidor todavía utiliza Nextcloud 33, instale primero la versión con Nextcloud 34 desde la lista de versiones y vuelva a actualizar. Nextcloud solo actualiza una versión mayor cada vez.
- Las aplicaciones instaladas desde la tienda de Nextcloud pueden necesitar actualizaciones compatibles y podrían desactivarse durante la actualización.
- La actualización migra el esquema de la base de datos, por lo que puede tardar más que una versión de mantenimiento.
- Los clientes de Nextcloud Desktop anteriores a la versión 3.3.50 ya no son compatibles.

**Correcciones**

- Corrige un fallo tras instalar o actualizar una aplicación en servidores aarch64 que dejaba Nextcloud inaccesible hasta reiniciarlo.
- Migrar una instalación grande de Nextcloud desde StartOS 0.3.5 ya no falla a mitad de la migración.

[Notas completas de la versión](https://github.com/nextcloud-releases/server/releases/tag/v35.0.0)`,
    de_DE: `Nextcloud wurde auf 35.0.0 aktualisiert — ein Hauptversionssprung von der Nextcloud-Reihe 34.

**Neu in Nextcloud 35**

- Freigaben haben einen einheitlichen Dialog und eine einheitliche Seitenleiste mit Freigabestatus und klareren Hinweisen zu Kennwörtern und Ablaufdaten.
- Fotos bietet Suche, Reiseerinnerungen, eine Karte, Diashows, EXIF-Bearbeitung und eine neu gestaltete Zeitleiste.
- Text bietet Inline-Kommentare und Fußnoten.
- Office bietet Dokumentvorschauen und Navigationsaktionen.

**Wissenswert**

- Wenn Ihr Server noch Nextcloud 33 verwendet, installieren Sie zuerst die Nextcloud-34-Version aus der Versionsliste und aktualisieren Sie dann erneut. Nextcloud aktualisiert immer nur um eine Hauptversion.
- Aus dem Nextcloud App Store installierte Apps benötigen möglicherweise kompatible Updates und können während des Upgrades deaktiviert werden.
- Das Update migriert das Datenbankschema und kann daher länger dauern als eine Wartungsversion.
- Nextcloud-Desktop-Clients vor Version 3.3.50 werden nicht mehr unterstützt.

**Behoben**

- Behebt einen Absturz nach dem Installieren oder Aktualisieren einer App auf aarch64-Servern, der Nextcloud bis zu einem Neustart unerreichbar machte.
- Die Migration einer großen Nextcloud-Installation von StartOS 0.3.5 bricht nicht mehr mittendrin ab.

[Vollständige Versionshinweise](https://github.com/nextcloud-releases/server/releases/tag/v35.0.0)`,
    pl_PL: `Zaktualizowano Nextcloud do wersji 35.0.0 — jest to aktualizacja główna z serii Nextcloud 34.

**Nowości w Nextcloud 35**

- Udostępnianie ma ujednolicone okno dialogowe i panel boczny, ze stanem udostępnień oraz jaśniejszymi wskazówkami dotyczącymi haseł i dat wygaśnięcia.
- Zdjęcia zyskują wyszukiwanie, wspomnienia z podróży, mapę, pokazy slajdów, edycję EXIF i przeprojektowaną oś czasu.
- Tekst zyskuje komentarze w tekście i przypisy dolne.
- Office zyskuje podglądy dokumentów i akcje nawigacyjne.

**Warto wiedzieć**

- Jeśli serwer nadal używa Nextcloud 33, najpierw zainstaluj wydanie z Nextcloud 34 z listy wersji, a następnie ponownie przeprowadź aktualizację. Nextcloud aktualizuje się tylko o jedną wersję główną naraz.
- Aplikacje zainstalowane ze sklepu Nextcloud mogą wymagać zgodnych aktualizacji i mogą zostać wyłączone podczas aktualizacji.
- Aktualizacja migruje schemat bazy danych, więc może potrwać dłużej niż wydanie konserwacyjne.
- Klienty Nextcloud Desktop starsze niż 3.3.50 nie są już obsługiwane.

**Poprawki**

- Naprawia awarię po zainstalowaniu lub zaktualizowaniu aplikacji na serwerach aarch64, po której Nextcloud był niedostępny do czasu ponownego uruchomienia.
- Migracja dużej instalacji Nextcloud ze StartOS 0.3.5 nie kończy się już błędem w trakcie.

[Pełne informacje o wydaniu](https://github.com/nextcloud-releases/server/releases/tag/v35.0.0)`,
    fr_FR: `Nextcloud a été mis à jour vers la version 35.0.0, une mise à niveau majeure depuis la série Nextcloud 34.

**Nouveautés de Nextcloud 35**

- Le partage bénéficie d'une boîte de dialogue et d'une barre latérale unifiées, avec l'état des partages et des indications plus claires sur les mots de passe et les dates d'expiration.
- Photos propose désormais la recherche, les souvenirs de voyage, une carte, des diaporamas, la modification des données EXIF et une chronologie repensée.
- Texte propose désormais les commentaires intégrés et les notes de bas de page.
- Office propose désormais des aperçus de documents et des actions de navigation.

**Bon à savoir**

- Si votre serveur utilise encore Nextcloud 33, installez d'abord la version avec Nextcloud 34 depuis la liste des versions, puis mettez à jour de nouveau. Nextcloud ne franchit qu'une version majeure à la fois.
- Les applications installées depuis la boutique Nextcloud peuvent nécessiter des mises à jour compatibles et être désactivées pendant la mise à niveau.
- La mise à jour migre le schéma de la base de données et peut donc prendre plus de temps qu'une version de maintenance.
- Les clients Nextcloud Desktop antérieurs à la version 3.3.50 ne sont plus pris en charge.

**Corrections**

- Corrige un plantage après l'installation ou la mise à jour d'une application sur les serveurs aarch64, qui rendait Nextcloud inaccessible jusqu'à son redémarrage.
- La migration d'une installation Nextcloud volumineuse depuis StartOS 0.3.5 n'échoue plus en cours de route.

[Notes de version complètes](https://github.com/nextcloud-releases/server/releases/tag/v35.0.0)`,
  },
  migrations: {
    up: async () => {},
    down: IMPOSSIBLE,
  },
})
