import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '34.0.3:3',
  releaseNotes: {
    en_US: `**Office editing.** A new **Office Suite** action connects Nextcloud to either Collabora Online or ONLYOFFICE Docs, both now in the marketplace, so you can open and edit documents, spreadsheets and presentations in your browser and work on them with other people at the same time.

Install the service you want, then its app from the Nextcloud app store — Nextcloud Office for Collabora, ONLYOFFICE for ONLYOFFICE Docs — and pick it in the Office Suite action. Collabora is the lighter of the two; ONLYOFFICE matches Microsoft Office formatting more closely but wants several gigabytes of memory.

The editor is served from your own Nextcloud address, so it works on your local network, a public domain and Tor alike, with nothing to switch between them.`,
    es_ES: `**Edición ofimática.** Una nueva acción **Suite ofimática** conecta Nextcloud con Collabora Online o con ONLYOFFICE Docs, ambos ya en el mercado, para que pueda abrir y editar documentos, hojas de cálculo y presentaciones en su navegador y trabajar en ellos con otras personas a la vez.

Instale el servicio que prefiera y después su aplicación desde la tienda de aplicaciones de Nextcloud —Nextcloud Office para Collabora, ONLYOFFICE para ONLYOFFICE Docs— y selecciónelo en la acción Suite ofimática. Collabora es la más ligera de las dos; ONLYOFFICE respeta mejor el formato de Microsoft Office, pero necesita varios gigabytes de memoria.

El editor se sirve desde su propia dirección de Nextcloud, así que funciona igual en su red local, en un dominio público y en Tor, sin nada que cambiar entre ellos.`,
    de_DE: `**Dokumentbearbeitung.** Eine neue Aktion **Office-Suite** verbindet Nextcloud entweder mit Collabora Online oder mit ONLYOFFICE Docs — beide ab sofort im Marktplatz. Damit öffnen und bearbeiten Sie Dokumente, Tabellen und Präsentationen im Browser und arbeiten gemeinsam mit anderen daran.

Installieren Sie den gewünschten Dienst, danach seine App aus dem Nextcloud App Store — Nextcloud Office für Collabora, ONLYOFFICE für ONLYOFFICE Docs — und wählen Sie ihn in der Aktion „Office-Suite“. Collabora ist die leichtere der beiden; ONLYOFFICE trifft die Formatierung von Microsoft Office genauer, benötigt aber mehrere Gigabyte Arbeitsspeicher.

Der Editor wird über Ihre eigene Nextcloud-Adresse ausgeliefert und funktioniert dadurch im Heimnetz, über eine öffentliche Domain und über Tor gleichermaßen, ohne dass Sie etwas umstellen müssen.`,
    pl_PL: `**Edycja dokumentów.** Nowa akcja **Pakiet biurowy** łączy Nextcloud z Collabora Online albo z ONLYOFFICE Docs — oba są już dostępne na rynku. Możesz otwierać i edytować dokumenty, arkusze i prezentacje w przeglądarce oraz pracować nad nimi razem z innymi osobami.

Zainstaluj wybraną usługę, następnie jej aplikację ze sklepu Nextcloud — Nextcloud Office dla Collabory, ONLYOFFICE dla ONLYOFFICE Docs — i wskaż ją w akcji Pakiet biurowy. Collabora jest lżejsza z tych dwóch; ONLYOFFICE wierniej odwzorowuje formatowanie Microsoft Office, ale potrzebuje kilku gigabajtów pamięci.

Edytor jest udostępniany spod Twojego własnego adresu Nextcloud, więc działa tak samo w sieci lokalnej, pod domeną publiczną i przez Tor — bez przełączania czegokolwiek.`,
    fr_FR: `**Édition bureautique.** Une nouvelle action **Suite bureautique** relie Nextcloud à Collabora Online ou à ONLYOFFICE Docs, tous deux désormais dans la place de marché, pour ouvrir et modifier documents, feuilles de calcul et présentations dans votre navigateur, et y travailler à plusieurs simultanément.

Installez le service de votre choix, puis son application depuis la boutique Nextcloud — Nextcloud Office pour Collabora, ONLYOFFICE pour ONLYOFFICE Docs — et sélectionnez-le dans l'action Suite bureautique. Collabora est la plus légère des deux ; ONLYOFFICE respecte mieux la mise en forme de Microsoft Office mais demande plusieurs gigaoctets de mémoire.

L'éditeur est servi depuis votre propre adresse Nextcloud : il fonctionne donc aussi bien sur votre réseau local, sur un domaine public et via Tor, sans rien à changer entre les deux.`,
  },
  migrations: {
    up: async () => {},
    down: IMPOSSIBLE,
  },
})
