import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '34.0.4:4',
  releaseNotes: {
    en_US: `**External Storage** now shows every NextExplorer drive, not only Files: each other drive appears as its own folder, such as NextExplorer (FileBrowser) for files imported from File Browser. Nextcloud looks for drives when it starts, so restart it after adding one.`,
    es_ES: `**Almacenamiento externo** ahora muestra todas las unidades de NextExplorer, no solo Files: cada una de las demás aparece como su propia carpeta, por ejemplo NextExplorer (FileBrowser) para los archivos importados desde File Browser. Nextcloud busca las unidades al iniciarse, así que reinícielo después de añadir una.`,
    de_DE: `**Externer Speicher** zeigt jetzt alle Laufwerke von NextExplorer an, nicht nur Files: jedes weitere Laufwerk erscheint als eigener Ordner, zum Beispiel NextExplorer (FileBrowser) für die aus File Browser importierten Dateien. Nextcloud sucht beim Start nach Laufwerken — starten Sie es also neu, nachdem Sie eines hinzugefügt haben.`,
    pl_PL: `**Magazyn zewnętrzny** pokazuje teraz wszystkie dyski NextExplorer, a nie tylko Files: każdy kolejny dysk pojawia się jako osobny folder, na przykład NextExplorer (FileBrowser) dla plików zaimportowanych z File Browser. Nextcloud szuka dysków podczas uruchamiania, więc uruchom go ponownie po dodaniu nowego.`,
    fr_FR: `**Stockage externe** affiche désormais tous les lecteurs de NextExplorer, et plus seulement Files : chaque autre lecteur apparaît comme un dossier à part, par exemple NextExplorer (FileBrowser) pour les fichiers importés depuis File Browser. Nextcloud recherche les lecteurs à son démarrage : redémarrez-le après en avoir ajouté un.`,
  },
  migrations: {
    up: async () => {},
    down: IMPOSSIBLE,
  },
})
