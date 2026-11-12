import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '35.0.2:7',
  releaseNotes: {
    en_US:
      "Post-Update Maintenance and Repair show the step they are running, and every background task's status shows how long it has gone without output. Nextcloud leaves maintenance mode when a repair finishes, including one that resumed after a restart.",
    es_ES:
      'Mantenimiento posterior a la actualización y Reparar muestran el paso que están ejecutando, y el estado de cada tarea en segundo plano muestra cuánto tiempo lleva sin producir salida. Nextcloud sale del modo de mantenimiento cuando termina una reparación, incluida una que se reanudó tras un reinicio.',
    de_DE:
      'Wartung nach dem Update und Reparieren zeigen den laufenden Schritt an, und der Status jeder Hintergrundaufgabe zeigt, wie lange sie keine Ausgabe erzeugt hat. Nextcloud verlässt den Wartungsmodus, wenn eine Reparatur abgeschlossen ist, auch wenn sie nach einem Neustart fortgesetzt wurde.',
    pl_PL:
      'Konserwacja po aktualizacji i Naprawa pokazują wykonywany krok, a stan każdego zadania w tle pokazuje, jak długo nie wypisało ono żadnych danych. Nextcloud opuszcza tryb konserwacji po zakończeniu naprawy, także takiej, która została wznowiona po restarcie.',
    fr_FR:
      "Maintenance post-mise à jour et Réparer affichent l'étape en cours, et l'état de chaque tâche en arrière-plan indique depuis combien de temps elle n'a produit aucune sortie. Nextcloud quitte le mode maintenance à la fin d'une réparation, y compris une réparation reprise après un redémarrage.",
  },
  migrations: {
    up: async () => {},
    down: IMPOSSIBLE,
  },
})
