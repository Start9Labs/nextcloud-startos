import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'
import { sdk } from '../sdk'

export const current = VersionInfo.of({
  version: '34.0.4:5',
  releaseNotes: {
    en_US: `Freed network ports left claimed by the StartOS 0.3.5 version of this package. Nothing else changes.`,
    es_ES: `Se han liberado los puertos de red que la versión de este paquete para StartOS 0.3.5 dejó reservados. No cambia nada más.`,
    de_DE: `Netzwerkports, die die StartOS-0.3.5-Version dieses Pakets belegt gelassen hatte, wurden freigegeben. Sonst ändert sich nichts.`,
    pl_PL: `Zwolniono porty sieciowe, które pozostawiła zajęte wersja tego pakietu dla StartOS 0.3.5. Poza tym nic się nie zmienia.`,
    fr_FR: `Libération des ports réseau que la version de ce paquet pour StartOS 0.3.5 avait laissés réservés. Rien d'autre ne change.`,
  },
  migrations: {
    up: async ({ effects }) => {
      const main = sdk.MultiHost.of(effects, 'main')
      await main.retirePort(8080)
      await main.retirePort(443)
    },
    down: IMPOSSIBLE,
  },
})
