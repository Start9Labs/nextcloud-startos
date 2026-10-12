import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '35.0.1:3',
  releaseNotes: {
    en_US: `- Nextcloud starts faster on servers holding many files.
- Restarting Nextcloud while it is still starting stops every process of the previous run, including its database.`,
    es_ES: `- Nextcloud se inicia más rápido en servidores con muchos archivos.
- Reiniciar Nextcloud mientras aún se está iniciando detiene todos los procesos de la ejecución anterior, incluida su base de datos.`,
    de_DE: `- Nextcloud startet schneller auf Servern mit vielen Dateien.
- Ein Neustart von Nextcloud, während es noch startet, beendet alle Prozesse des vorherigen Laufs, einschließlich seiner Datenbank.`,
    pl_PL: `- Nextcloud uruchamia się szybciej na serwerach z dużą liczbą plików.
- Ponowne uruchomienie Nextcloud w trakcie jego uruchamiania zatrzymuje wszystkie procesy poprzedniego uruchomienia, w tym bazę danych.`,
    fr_FR: `- Nextcloud démarre plus vite sur les serveurs contenant de nombreux fichiers.
- Redémarrer Nextcloud pendant son démarrage arrête tous les processus de l'exécution précédente, y compris sa base de données.`,
  },
  migrations: {
    up: async () => {},
    down: IMPOSSIBLE,
  },
})
