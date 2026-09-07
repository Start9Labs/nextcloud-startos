import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '34.0.3:6',
  releaseNotes: {
    en_US:
      'Installation and update progress show each step as it runs — copying application files, then creating or migrating the database.',
    es_ES:
      'El progreso de la instalación y de la actualización muestra cada paso a medida que se ejecuta: copiar los archivos de la aplicación y, después, crear o migrar la base de datos.',
    de_DE:
      'Der Installations- und Aktualisierungsfortschritt zeigt jeden Schritt, während er läuft: Anwendungsdateien kopieren und anschließend die Datenbank erstellen oder migrieren.',
    pl_PL:
      'Postęp instalacji i aktualizacji pokazuje każdy krok w trakcie jego wykonywania: kopiowanie plików aplikacji, a następnie tworzenie lub migrację bazy danych.',
    fr_FR:
      "La progression de l'installation et de la mise à jour affiche chaque étape au fur et à mesure : copie des fichiers de l'application, puis création ou migration de la base de données.",
  },
  migrations: {
    up: async () => {},
    down: IMPOSSIBLE,
  },
})
