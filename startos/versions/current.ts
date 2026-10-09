import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'
import { storeJson } from '../fileModels/store.json'
import { sdk } from '../sdk'

export const current = VersionInfo.of({
  version: '35.0.1:2',
  releaseNotes: {
    en_US: `- Disable Maintenance Mode, Repair and Scan Files ask for confirmation before running.
- The Office Suite, Delete Files in Trash and External Storage settings explain what each choice does.
- Reset Admin Password offers only members of Nextcloud's admin group.
- The Delete Files in Trash choices are translated.
- Network ports left reserved by the StartOS 0.3.5 version of this package are freed. If that version had a Tor address, Nextcloud moves it to the Web UI, keeping the same .onion address, as soon as a version of Tor that allows it is installed.`,
    es_ES: `- Desactivar modo de mantenimiento, Reparar y Escanear archivos piden confirmación antes de ejecutarse.
- Los ajustes Suite ofimática, Eliminar los archivos de la papelera y Almacenamiento externo explican qué hace cada opción.
- Restablecer contraseña de administrador solo ofrece miembros del grupo admin de Nextcloud.
- Las opciones de Eliminar los archivos de la papelera están traducidas.
- Se liberan los puertos de red que la versión de este paquete para StartOS 0.3.5 dejó reservados. Si esa versión tenía una dirección Tor, Nextcloud la traslada a la interfaz web, conservando la misma dirección .onion, en cuanto se instala una versión de Tor que lo permita.`,
    de_DE: `- Wartungsmodus deaktivieren, Reparieren und Dateien scannen fragen vor der Ausführung nach einer Bestätigung.
- Die Einstellungen Office-Suite, Dateien im Papierkorb löschen und Externer Speicher erklären, was jede Auswahl bewirkt.
- Admin-Passwort zurücksetzen bietet nur Mitglieder der Nextcloud-Gruppe admin an.
- Die Auswahlmöglichkeiten von Dateien im Papierkorb löschen sind übersetzt.
- Netzwerkports, die die StartOS-0.3.5-Version dieses Pakets belegt gelassen hatte, werden freigegeben. Hatte diese Version eine Tor-Adresse, verlegt Nextcloud sie auf die Weboberfläche und behält dieselbe .onion-Adresse, sobald eine Tor-Version installiert ist, die das erlaubt.`,
    pl_PL: `- Wyłącz tryb konserwacji, Napraw i Skanuj pliki proszą o potwierdzenie przed uruchomieniem.
- Ustawienia Pakiet biurowy, Usuwanie plików z kosza i Magazyn zewnętrzny wyjaśniają, co oznacza każdy wybór.
- Resetuj hasło administratora oferuje tylko członków grupy admin w Nextcloud.
- Opcje ustawienia Usuwanie plików z kosza są przetłumaczone.
- Porty sieciowe, które wersja tego pakietu dla StartOS 0.3.5 pozostawiła zajęte, zostają zwolnione. Jeśli ta wersja miała adres Tor, Nextcloud przenosi go na interfejs webowy, zachowując ten sam adres .onion, gdy tylko zostanie zainstalowana wersja Tora, która na to pozwala.`,
    fr_FR: `- Désactiver le mode maintenance, Réparer et Scanner les fichiers demandent une confirmation avant de s'exécuter.
- Les réglages Suite bureautique, Suppression des fichiers de la corbeille et Stockage externe expliquent l'effet de chaque choix.
- Réinitialiser le mot de passe administrateur ne propose que les membres du groupe admin de Nextcloud.
- Les choix de Suppression des fichiers de la corbeille sont traduits.
- Les ports réseau que la version de ce paquet pour StartOS 0.3.5 avait laissés réservés sont libérés. Si cette version avait une adresse Tor, Nextcloud la déplace vers l'interface web, en conservant la même adresse .onion, dès qu'une version de Tor qui le permet est installée.`,
  },
  migrations: {
    up: async ({ effects }) => {
      // Tor keeps an .onion on a retired port as unused; reattachUiOnions moves it to 80.
      const main = sdk.MultiHost.of(effects, 'main')
      const retired = [await main.retirePort(8080), await main.retirePort(443)]
      if (retired.some(Boolean)) {
        await storeJson.merge(effects, { reattachUiOnions: true })
      }
    },
    down: IMPOSSIBLE,
  },
})
