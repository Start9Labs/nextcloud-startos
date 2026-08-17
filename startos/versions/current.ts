import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'
import { sdk } from '../sdk'
import { migrateFrom035x } from './from035x'

export const current = VersionInfo.of({
  version: '33.0.8:1',
  releaseNotes: {
    en_US: `Nextcloud's built-in update check can no longer reach the upstream update server. Automatic checks were already off, but \`occ update:check\` bypassed that switch; the update-server address now points at a reserved name that cannot resolve. StartOS is what delivers Nextcloud updates here.

Updated Nextcloud to 33.0.8 — a maintenance release of upstream fixes and security hardening.

**Fixes**

- Thumbnails work again for PDF, SVG, TIFF, HEIC, PSD and the other ImageMagick formats. Nextcloud 33.0.7 disabled those previews upstream; 33.0.8 restores them.
- Many sharing, file and encryption fixes — shares no longer break when a recipient or owner is missing, rejected shares stay rejected, and zero-byte encrypted files report the correct size.
- Security hardening: stricter host and IP validation, an updated code signing revocation list, and admin permission is now required for every system tag change.
- Cleared an abandoned internal task left behind by an older release, which on some servers could stop Nextcloud with no way to dismiss it.

**New**

- Federated calendar invitations can be accepted or declined.
- Password confirmation can be skipped for selected IP ranges.

Full changelog: https://github.com/nextcloud-releases/server/releases/tag/v33.0.8`,
    es_ES: `La comprobación de actualizaciones integrada de Nextcloud ya no puede alcanzar el servidor de actualizaciones original. Las comprobaciones automáticas ya estaban desactivadas, pero \`occ update:check\` eludía ese ajuste; la dirección del servidor de actualizaciones apunta ahora a un nombre reservado que no puede resolverse. Aquí es StartOS quien entrega las actualizaciones de Nextcloud.

Nextcloud actualizado a 33.0.8: una versión de mantenimiento con correcciones y refuerzos de seguridad de upstream.

**Correcciones**

- Las miniaturas vuelven a funcionar para PDF, SVG, TIFF, HEIC, PSD y los demás formatos de ImageMagick. Nextcloud 33.0.7 desactivó esas vistas previas en upstream; 33.0.8 las restaura.
- Numerosas correcciones de compartición, archivos y cifrado: los recursos compartidos ya no fallan cuando falta un destinatario o un propietario, los rechazados siguen rechazados y los archivos cifrados de cero bytes informan del tamaño correcto.
- Refuerzos de seguridad: validación más estricta de host e IP, lista de revocación de firma de código actualizada y ahora se requieren permisos de administrador para cualquier cambio de etiquetas del sistema.
- Se ha eliminado una tarea interna abandonada por una versión anterior que, en algunos servidores, podía detener Nextcloud sin forma de descartarla.

**Novedades**

- Las invitaciones a calendarios federados se pueden aceptar o rechazar.
- La confirmación de contraseña se puede omitir en determinados rangos de IP.

Registro de cambios completo: https://github.com/nextcloud-releases/server/releases/tag/v33.0.8`,
    de_DE: `Die eingebaute Update-Prüfung von Nextcloud erreicht den Upstream-Update-Server nicht mehr. Automatische Prüfungen waren bereits deaktiviert, \`occ update:check\` umging diesen Schalter jedoch; die Adresse des Update-Servers verweist nun auf einen reservierten Namen, der nicht aufgelöst werden kann. Nextcloud-Updates liefert hier StartOS.

Nextcloud auf 33.0.8 aktualisiert — eine Wartungsversion mit Fehlerkorrekturen und Sicherheitshärtungen aus dem Upstream.

**Korrekturen**

- Miniaturansichten funktionieren wieder für PDF, SVG, TIFF, HEIC, PSD und die übrigen ImageMagick-Formate. Nextcloud 33.0.7 hatte diese Vorschauen im Upstream deaktiviert; 33.0.8 stellt sie wieder her.
- Zahlreiche Korrekturen bei Freigaben, Dateien und Verschlüsselung — Freigaben brechen nicht mehr ab, wenn ein Empfänger oder Eigentümer fehlt, abgelehnte Freigaben bleiben abgelehnt, und verschlüsselte Dateien mit null Byte melden die richtige Größe.
- Sicherheitshärtung: strengere Host- und IP-Prüfung, aktualisierte Sperrliste für Code-Signaturen, und für jede Änderung an System-Tags sind nun Administratorrechte erforderlich.
- Eine von einer älteren Version zurückgelassene, verwaiste interne Aufgabe wurde entfernt; sie konnte Nextcloud auf manchen Servern anhalten, ohne dass sie sich schließen ließ.

**Neu**

- Einladungen zu föderierten Kalendern können angenommen oder abgelehnt werden.
- Die Passwortbestätigung kann für ausgewählte IP-Bereiche übersprungen werden.

Vollständiges Änderungsprotokoll: https://github.com/nextcloud-releases/server/releases/tag/v33.0.8`,
    pl_PL: `Wbudowane sprawdzanie aktualizacji Nextcloud nie może już połączyć się z serwerem aktualizacji projektu źródłowego. Automatyczne sprawdzanie było już wyłączone, ale \`occ update:check\` omijał to ustawienie; adres serwera aktualizacji wskazuje teraz zastrzeżoną nazwę, której nie da się rozwiązać. Aktualizacje Nextcloud dostarcza tutaj StartOS.

Zaktualizowano Nextcloud do 33.0.8 — wydanie konserwacyjne z poprawkami i wzmocnieniami bezpieczeństwa z upstreamu.

**Poprawki**

- Miniatury znów działają dla plików PDF, SVG, TIFF, HEIC, PSD i pozostałych formatów ImageMagick. Nextcloud 33.0.7 wyłączył te podglądy w upstreamie; 33.0.8 je przywraca.
- Wiele poprawek dotyczących udostępniania, plików i szyfrowania — udostępnienia nie psują się już przy brakującym odbiorcy lub właścicielu, odrzucone pozostają odrzucone, a zaszyfrowane pliki o zerowym rozmiarze podają prawidłowy rozmiar.
- Wzmocnienia bezpieczeństwa: ściślejsza weryfikacja hosta i adresu IP, zaktualizowana lista unieważnień podpisu kodu oraz wymóg uprawnień administratora przy każdej zmianie tagów systemowych.
- Usunięto porzucone zadanie wewnętrzne pozostawione przez starsze wydanie, które na niektórych serwerach mogło zatrzymać Nextcloud bez możliwości jego odrzucenia.

**Nowości**

- Zaproszenia do kalendarzy federacyjnych można zaakceptować lub odrzucić.
- Potwierdzanie hasła można pominąć dla wybranych zakresów adresów IP.

Pełny dziennik zmian: https://github.com/nextcloud-releases/server/releases/tag/v33.0.8`,
    fr_FR: `La vérification de mise à jour intégrée de Nextcloud ne peut plus joindre le serveur de mises à jour d'origine. Les vérifications automatiques étaient déjà désactivées, mais \`occ update:check\` contournait ce réglage ; l'adresse du serveur de mises à jour pointe désormais vers un nom réservé qui ne peut pas être résolu. Ici, c'est StartOS qui livre les mises à jour de Nextcloud.

Nextcloud mis à jour vers 33.0.8 — une version de maintenance apportant des correctifs et des renforcements de sécurité en amont.

**Correctifs**

- Les miniatures fonctionnent à nouveau pour les PDF, SVG, TIFF, HEIC, PSD et les autres formats ImageMagick. Nextcloud 33.0.7 avait désactivé ces aperçus en amont ; 33.0.8 les rétablit.
- De nombreux correctifs de partage, de fichiers et de chiffrement — les partages ne cassent plus lorsqu'un destinataire ou un propriétaire est absent, les partages refusés le restent, et les fichiers chiffrés de zéro octet indiquent la bonne taille.
- Renforcements de sécurité : validation plus stricte des hôtes et des adresses IP, liste de révocation des signatures de code mise à jour, et droits d'administrateur désormais requis pour toute modification des étiquettes système.
- Suppression d'une tâche interne abandonnée par une version antérieure qui, sur certains serveurs, pouvait arrêter Nextcloud sans possibilité de l'écarter.

**Nouveautés**

- Les invitations aux agendas fédérés peuvent être acceptées ou refusées.
- La confirmation du mot de passe peut être ignorée pour certaines plages d'adresses IP.

Journal des modifications complet : https://github.com/nextcloud-releases/server/releases/tag/v33.0.8`,
  },
  migrations: {
    up: async ({ effects, progress }) => {
      // The action was renamed, so this task's replay key can never be cleared by running it.
      await sdk.action.clearTask(effects, 'nextcloud:create-admin-user')
      await migrateFrom035x(effects, progress)
    },
    down: IMPOSSIBLE,
  },
})
