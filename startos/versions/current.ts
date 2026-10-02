import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'
import { storeJson } from '../fileModels/store.json'
import { sdk } from '../sdk'

export const current = VersionInfo.of({
  version: '35.0.1:1',
  releaseNotes: {
    en_US: `Updated Nextcloud to 35.0.1 — a major upgrade from the Nextcloud 34 series.

**New in Nextcloud 35**

- Sharing has a unified dialog and sidebar, with share status and clearer password and expiration guidance.
- Photos adds search, trip memories, a map, slideshows, EXIF editing and a redesigned timeline.
- Text adds inline comments and footnotes.
- Office adds document previews and navigation actions.

**Worth knowing**

- A server still on Nextcloud 33 is offered the Nextcloud 34 release first; once it is installed, this update follows. Nextcloud upgrades only one major version at a time.
- Network ports left reserved by the StartOS 0.3.5 version of this package are freed. If that version had a Tor address, Nextcloud moves it to the Web UI, keeping the same .onion address, as soon as a version of Tor that allows it is installed.
- Apps installed from the Nextcloud app store may need compatible updates and can be disabled during the upgrade.
- The update migrates the database schema, so it can take longer than a maintenance release.
- Nextcloud Desktop clients older than 3.3.50 are no longer supported.

[Full release notes](https://github.com/nextcloud-releases/server/releases/tag/v35.0.1)`,
    es_ES: `Nextcloud se ha actualizado a la versión 35.0.1, una actualización mayor desde la serie Nextcloud 34.

**Novedades de Nextcloud 35**

- El uso compartido tiene un cuadro de diálogo y una barra lateral unificados, con el estado de los recursos compartidos e indicaciones más claras sobre contraseñas y vencimiento.
- Fotos incorpora búsqueda, recuerdos de viajes, un mapa, presentaciones, edición de EXIF y una cronología rediseñada.
- Texto incorpora comentarios en línea y notas al pie.
- Office incorpora vistas previas de documentos y acciones de navegación.

**Conviene saber**

- A un servidor que todavía utiliza Nextcloud 33 se le ofrece primero la versión con Nextcloud 34; una vez instalada, aparece esta actualización. Nextcloud solo actualiza una versión mayor cada vez.
- Se liberan los puertos de red que la versión de este paquete para StartOS 0.3.5 dejó reservados. Si esa versión tenía una dirección Tor, Nextcloud la traslada a la interfaz web, conservando la misma dirección .onion, en cuanto se instala una versión de Tor que lo permita.
- Las aplicaciones instaladas desde la tienda de Nextcloud pueden necesitar actualizaciones compatibles y podrían desactivarse durante la actualización.
- La actualización migra el esquema de la base de datos, por lo que puede tardar más que una versión de mantenimiento.
- Los clientes de Nextcloud Desktop anteriores a la versión 3.3.50 ya no son compatibles.

[Notas completas de la versión](https://github.com/nextcloud-releases/server/releases/tag/v35.0.1)`,
    de_DE: `Nextcloud wurde auf 35.0.1 aktualisiert — ein Hauptversionssprung von der Nextcloud-Reihe 34.

**Neu in Nextcloud 35**

- Freigaben haben einen einheitlichen Dialog und eine einheitliche Seitenleiste mit Freigabestatus und klareren Hinweisen zu Kennwörtern und Ablaufdaten.
- Fotos bietet Suche, Reiseerinnerungen, eine Karte, Diashows, EXIF-Bearbeitung und eine neu gestaltete Zeitleiste.
- Text bietet Inline-Kommentare und Fußnoten.
- Office bietet Dokumentvorschauen und Navigationsaktionen.

**Wissenswert**

- Einem Server, der noch Nextcloud 33 verwendet, wird zuerst die Nextcloud-34-Version angeboten; sobald sie installiert ist, folgt dieses Update. Nextcloud aktualisiert immer nur um eine Hauptversion.
- Netzwerkports, die die StartOS-0.3.5-Version dieses Pakets belegt gelassen hatte, werden freigegeben. Hatte diese Version eine Tor-Adresse, verlegt Nextcloud sie auf die Weboberfläche und behält dieselbe .onion-Adresse, sobald eine Tor-Version installiert ist, die das erlaubt.
- Aus dem Nextcloud App Store installierte Apps benötigen möglicherweise kompatible Updates und können während des Upgrades deaktiviert werden.
- Das Update migriert das Datenbankschema und kann daher länger dauern als eine Wartungsversion.
- Nextcloud-Desktop-Clients vor Version 3.3.50 werden nicht mehr unterstützt.

[Vollständige Versionshinweise](https://github.com/nextcloud-releases/server/releases/tag/v35.0.1)`,
    pl_PL: `Zaktualizowano Nextcloud do wersji 35.0.1 — jest to aktualizacja główna z serii Nextcloud 34.

**Nowości w Nextcloud 35**

- Udostępnianie ma ujednolicone okno dialogowe i panel boczny, ze stanem udostępnień oraz jaśniejszymi wskazówkami dotyczącymi haseł i dat wygaśnięcia.
- Zdjęcia zyskują wyszukiwanie, wspomnienia z podróży, mapę, pokazy slajdów, edycję EXIF i przeprojektowaną oś czasu.
- Tekst zyskuje komentarze w tekście i przypisy dolne.
- Office zyskuje podglądy dokumentów i akcje nawigacyjne.

**Warto wiedzieć**

- Serwer, który nadal używa Nextcloud 33, otrzyma najpierw wydanie z Nextcloud 34; po jego zainstalowaniu pojawi się ta aktualizacja. Nextcloud aktualizuje się tylko o jedną wersję główną naraz.
- Porty sieciowe, które wersja tego pakietu dla StartOS 0.3.5 pozostawiła zajęte, zostają zwolnione. Jeśli ta wersja miała adres Tor, Nextcloud przenosi go na interfejs webowy, zachowując ten sam adres .onion, gdy tylko zostanie zainstalowana wersja Tora, która na to pozwala.
- Aplikacje zainstalowane ze sklepu Nextcloud mogą wymagać zgodnych aktualizacji i mogą zostać wyłączone podczas aktualizacji.
- Aktualizacja migruje schemat bazy danych, więc może potrwać dłużej niż wydanie konserwacyjne.
- Klienty Nextcloud Desktop starsze niż 3.3.50 nie są już obsługiwane.

[Pełne informacje o wydaniu](https://github.com/nextcloud-releases/server/releases/tag/v35.0.1)`,
    fr_FR: `Nextcloud a été mis à jour vers la version 35.0.1, une mise à niveau majeure depuis la série Nextcloud 34.

**Nouveautés de Nextcloud 35**

- Le partage bénéficie d'une boîte de dialogue et d'une barre latérale unifiées, avec l'état des partages et des indications plus claires sur les mots de passe et les dates d'expiration.
- Photos propose désormais la recherche, les souvenirs de voyage, une carte, des diaporamas, la modification des données EXIF et une chronologie repensée.
- Texte propose désormais les commentaires intégrés et les notes de bas de page.
- Office propose désormais des aperçus de documents et des actions de navigation.

**Bon à savoir**

- Un serveur encore sous Nextcloud 33 se voit d'abord proposer la version avec Nextcloud 34 ; une fois celle-ci installée, cette mise à jour suit. Nextcloud ne franchit qu'une version majeure à la fois.
- Les ports réseau que la version de ce paquet pour StartOS 0.3.5 avait laissés réservés sont libérés. Si cette version avait une adresse Tor, Nextcloud la déplace vers l'interface web, en conservant la même adresse .onion, dès qu'une version de Tor qui le permet est installée.
- Les applications installées depuis la boutique Nextcloud peuvent nécessiter des mises à jour compatibles et être désactivées pendant la mise à niveau.
- La mise à jour migre le schéma de la base de données et peut donc prendre plus de temps qu'une version de maintenance.
- Les clients Nextcloud Desktop antérieurs à la version 3.3.50 ne sont plus pris en charge.

[Notes de version complètes](https://github.com/nextcloud-releases/server/releases/tag/v35.0.1)`,
  },
  migrations: {
    up: async ({ effects }) => {
      // Tor keeps an .onion on a retired port as unused; reattachUiOnions moves it to 80.
      const main = sdk.MultiHost.of(effects, 'main')
      const retired = [await main.retirePort(8080), await main.retirePort(443)]
      if (retired.some(Boolean)) {
        await storeJson.merge(effects, { reattachUiOnions: true })
      }
    },
    down: IMPOSSIBLE,
  },
})
