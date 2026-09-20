import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '34.0.4:5',
  releaseNotes: {
    en_US: `Fixes a crash after installing or updating an app on aarch64 servers that left Nextcloud unreachable until it was restarted.`,
    es_ES: `Corrige un fallo tras instalar o actualizar una aplicación en servidores aarch64 que dejaba Nextcloud inaccesible hasta reiniciarlo.`,
    de_DE: `Behebt einen Absturz nach dem Installieren oder Aktualisieren einer App auf aarch64-Servern, der Nextcloud bis zu einem Neustart unerreichbar machte.`,
    pl_PL: `Naprawia awarię po zainstalowaniu lub zaktualizowaniu aplikacji na serwerach aarch64, po której Nextcloud był niedostępny do czasu ponownego uruchomienia.`,
    fr_FR: `Corrige un plantage après l'installation ou la mise à jour d'une application sur les serveurs aarch64, qui rendait Nextcloud inaccessible jusqu'à son redémarrage.`,
  },
  migrations: {
    up: async () => {},
    down: IMPOSSIBLE,
  },
})
