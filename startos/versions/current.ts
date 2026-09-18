import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '34.0.4:3',
  releaseNotes: {
    en_US: `**External Storage** can now surface NextExplorer, the recommended file server: its Files drive appears as a NextExplorer folder in Nextcloud Files.

An update that would skip a Nextcloud major version is refused before anything on disk changes. Install the Nextcloud 33 release from the version list first, then update again — this also works on a server where an earlier attempt at this update failed.`,
    es_ES: `**Almacenamiento externo** ahora puede mostrar NextExplorer, el servidor de archivos recomendado: su unidad Files aparece como una carpeta NextExplorer en Archivos de Nextcloud.

Una actualización que saltaría una versión mayor de Nextcloud se rechaza antes de que cambie nada en el disco. Instale primero la versión con Nextcloud 33 desde la lista de versiones y vuelva a actualizar; esto también funciona en un servidor donde un intento anterior de esta actualización falló.`,
    de_DE: `**Externer Speicher** kann jetzt NextExplorer einbinden, den empfohlenen Dateiserver: sein Laufwerk Files erscheint als Ordner NextExplorer in Nextcloud Dateien.

Ein Update, das eine Nextcloud-Hauptversion überspringen würde, wird abgelehnt, bevor sich etwas auf der Festplatte ändert. Installieren Sie zuerst die Version mit Nextcloud 33 aus der Versionsliste und aktualisieren Sie dann erneut — das funktioniert auch auf einem Server, auf dem ein früherer Versuch dieses Updates fehlgeschlagen ist.`,
    pl_PL: `**Magazyn zewnętrzny** może teraz pokazać NextExplorer, zalecany serwer plików: jego dysk Files pojawia się jako folder NextExplorer w Plikach Nextcloud.

Aktualizacja, która pominęłaby główną wersję Nextcloud, jest odrzucana, zanim cokolwiek zmieni się na dysku. Najpierw zainstaluj wydanie z Nextcloud 33 z listy wersji, a następnie zaktualizuj ponownie — działa to również na serwerze, na którym wcześniejsza próba tej aktualizacji się nie powiodła.`,
    fr_FR: `**Stockage externe** peut désormais présenter NextExplorer, le serveur de fichiers recommandé : son lecteur Files apparaît comme un dossier NextExplorer dans Fichiers de Nextcloud.

Une mise à jour qui sauterait une version majeure de Nextcloud est refusée avant que quoi que ce soit ne change sur le disque. Installez d'abord la version avec Nextcloud 33 depuis la liste des versions, puis mettez à jour à nouveau — cela fonctionne aussi sur un serveur où une tentative précédente de cette mise à jour a échoué.`,
  },
  migrations: {
    up: async () => {},
    down: IMPOSSIBLE,
  },
})
