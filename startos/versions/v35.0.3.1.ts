import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'
import { storeJson } from '../fileModels/store.json'

export const v_35_0_3_1 = VersionInfo.of({
  version: '35.0.3:1',
  releaseNotes: {
    en_US:
      'Talk calls can now run through the new Nextcloud Talk HPB service, so calls hold many more participants. Choose it under Talk Calls in the Configure action. A server that relayed calls through Coturn keeps doing so.',
    es_ES:
      'Las llamadas de Talk ahora pueden funcionar a través del nuevo servicio Nextcloud Talk HPB, para que admitan muchos más participantes. Elíjalo en Llamadas de Talk, en la acción Configurar. Un servidor que retransmitía las llamadas a través de Coturn lo sigue haciendo.',
    de_DE:
      'Talk-Anrufe können jetzt über den neuen Dienst Nextcloud Talk HPB laufen und so deutlich mehr Teilnehmer fassen. Wählen Sie ihn unter Talk-Anrufe in der Aktion Konfigurieren. Ein Server, der Anrufe über Coturn weitergeleitet hat, tut das weiterhin.',
    pl_PL:
      'Połączenia Talk mogą teraz działać przez nową usługę Nextcloud Talk HPB, dzięki czemu mieszczą znacznie więcej uczestników. Wybierz ją w opcji Połączenia Talk w akcji Konfiguruj. Serwer, który przekazywał połączenia przez Coturn, nadal to robi.',
    fr_FR:
      "Les appels Talk peuvent désormais passer par le nouveau service Nextcloud Talk HPB, pour accueillir bien plus de participants. Choisissez-le sous Appels Talk dans l'action Configurer. Un serveur qui relayait les appels via Coturn continue de le faire.",
  },
  migrations: {
    up: async ({ effects }) => {
      const store = await storeJson.read().once()
      if (!store) return
      await storeJson.merge(effects, {
        ...(store.talkTurn === true && { talkCalls: 'coturn' as const }),
        ...(typeof store.talkTurnConfigured === 'string' && {
          talkConfigured: store.talkTurnConfigured,
        }),
      })
    },
    down: IMPOSSIBLE,
  },
})
