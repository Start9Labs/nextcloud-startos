import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '34.0.3:6',
  releaseNotes: {
    en_US: `With **Relay Talk Calls Through Coturn** turned on and Coturn given a public domain, the service restarted every few seconds and never finished starting. It now starts, and Talk relays calls through Coturn.

Installation and update progress show each step as it runs — copying application files, then creating or migrating the database.`,
    es_ES: `Con **Retransmitir las llamadas de Talk a través de Coturn** activado y un dominio público asignado a Coturn, el servicio se reiniciaba cada pocos segundos y nunca terminaba de arrancar. Ahora arranca, y Talk retransmite las llamadas a través de Coturn.

El progreso de la instalación y de la actualización muestra cada paso a medida que se ejecuta: copiar los archivos de la aplicación y, después, crear o migrar la base de datos.`,
    de_DE: `Mit eingeschaltetem **Talk-Anrufe über Coturn weiterleiten** und einer öffentlichen Domain für Coturn startete der Dienst alle paar Sekunden neu und fuhr nie vollständig hoch. Jetzt startet er, und Talk leitet Anrufe über Coturn weiter.

Der Installations- und Aktualisierungsfortschritt zeigt jeden Schritt, während er läuft: Anwendungsdateien kopieren und anschließend die Datenbank erstellen oder migrieren.`,
    pl_PL: `Przy włączonym **Przekazuj połączenia Talk przez Coturn** i publicznej domenie przypisanej do Coturn usługa restartowała się co kilka sekund i nigdy nie kończyła uruchamiania. Teraz się uruchamia, a Talk przekazuje połączenia przez Coturn.

Postęp instalacji i aktualizacji pokazuje każdy krok w trakcie jego wykonywania: kopiowanie plików aplikacji, a następnie tworzenie lub migrację bazy danych.`,
    fr_FR: `Avec **Relayer les appels Talk via Coturn** activé et un domaine public attribué à Coturn, le service redémarrait toutes les quelques secondes sans jamais finir de se lancer. Il se lance désormais, et Talk relaie les appels via Coturn.

La progression de l'installation et de la mise à jour affiche chaque étape au fur et à mesure : copie des fichiers de l'application, puis création ou migration de la base de données.`,
  },
  migrations: {
    up: async () => {},
    down: IMPOSSIBLE,
  },
})
