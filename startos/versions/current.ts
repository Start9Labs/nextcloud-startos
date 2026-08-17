import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '33.0.8:3',
  releaseNotes: {
    en_US: `New optional dependency on **Coturn** relays Nextcloud Talk's voice and video calls through NAT and restrictive firewalls, so a call connects even when both parties are behind one. Turn it on with **Relay Talk Calls Through Coturn** in the Configure action; it needs the Talk app installed in Nextcloud and Coturn running with a public domain of its own. Talk's existing STUN and TURN entries are left alone.`,
    es_ES: `La nueva dependencia opcional de **Coturn** retransmite las llamadas de voz y vídeo de Nextcloud Talk a través de NAT y de cortafuegos restrictivos, de modo que una llamada se establece incluso cuando ambas partes están detrás de uno. Actívela con **Retransmitir las llamadas de Talk a través de Coturn** en la acción Configuración; requiere la aplicación Talk instalada en Nextcloud y Coturn en ejecución con su propio dominio público. Las entradas STUN y TURN que Talk ya tuviera se dejan intactas.`,
    de_DE: `Die neue optionale Abhängigkeit **Coturn** leitet die Sprach- und Videoanrufe von Nextcloud Talk durch NAT und restriktive Firewalls, sodass ein Anruf auch dann zustande kommt, wenn beide Seiten dahinter sitzen. Einschalten mit **Talk-Anrufe über Coturn weiterleiten** in der Aktion Konfiguration; erforderlich sind die in Nextcloud installierte Talk-App und ein laufendes Coturn mit eigener öffentlicher Domain. Bereits vorhandene STUN- und TURN-Einträge von Talk bleiben unangetastet.`,
    pl_PL: `Nowa opcjonalna zależność **Coturn** przekazuje połączenia głosowe i wideo Nextcloud Talk przez NAT i restrykcyjne zapory, dzięki czemu połączenie zestawia się nawet wtedy, gdy obie strony są za nimi. Włącz ją opcją **Przekazuj połączenia Talk przez Coturn** w akcji Konfiguracja; wymaga zainstalowanej w Nextcloud aplikacji Talk oraz działającego Coturn z własną domeną publiczną. Istniejące wpisy STUN i TURN aplikacji Talk pozostają nietknięte.`,
    fr_FR: `La nouvelle dépendance optionnelle **Coturn** relaie les appels audio et vidéo de Nextcloud Talk à travers le NAT et les pare-feu restrictifs, de sorte qu'un appel aboutit même lorsque les deux parties se trouvent derrière l'un d'eux. Activez-la avec **Relayer les appels Talk via Coturn** dans l'action Configuration ; elle nécessite l'application Talk installée dans Nextcloud et un Coturn démarré avec un domaine public qui lui est propre. Les entrées STUN et TURN déjà présentes dans Talk ne sont pas modifiées.`,
  },
  migrations: {
    up: async () => {},
    down: IMPOSSIBLE,
  },
})
