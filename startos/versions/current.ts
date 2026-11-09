import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '35.0.2:5',
  releaseNotes: {
    en_US:
      'Requires StartOS 0.4.1 or later. FileBrowser external storage now requires FileBrowser Quantum 2.0.2-stable:3 or later; the original File Browser is no longer supported. If you use the original File Browser, switch it in the Marketplace: open File Browser, then under Alternative Implementations choose FileBrowser Quantum and select Switch. Your files and accounts carry over, but back up File Browser first; afterwards, re-apply per-user folder restrictions and access rules, and recreate share links.',
    es_ES:
      'Requiere StartOS 0.4.1 o posterior. El almacenamiento externo de FileBrowser ahora requiere FileBrowser Quantum 2.0.2-stable:3 o posterior; el File Browser original ya no es compatible. Si usa el File Browser original, cámbielo en el Mercado: abra File Browser, luego en Implementaciones alternativas elija FileBrowser Quantum y seleccione Cambiar. Sus archivos y cuentas se conservan, pero haga antes una copia de seguridad de File Browser; después, vuelva a aplicar las restricciones de carpeta por usuario y las reglas de acceso, y cree de nuevo los enlaces compartidos.',
    de_DE:
      'Erfordert StartOS 0.4.1 oder neuer. Der externe FileBrowser-Speicher erfordert jetzt FileBrowser Quantum 2.0.2-stable:3 oder neuer; der ursprüngliche File Browser wird nicht mehr unterstützt. Wenn Sie den ursprünglichen File Browser verwenden, wechseln Sie im Marktplatz: Öffnen Sie File Browser, wählen Sie unter Alternative Implementierungen FileBrowser Quantum und dann Wechseln. Ihre Dateien und Konten bleiben erhalten, aber sichern Sie File Browser vorher; richten Sie danach benutzerbezogene Ordnerbeschränkungen und Zugriffsregeln erneut ein und erstellen Sie Freigabelinks neu.',
    pl_PL:
      'Wymaga StartOS 0.4.1 lub nowszego. Magazyn zewnętrzny FileBrowser wymaga teraz FileBrowser Quantum 2.0.2-stable:3 lub nowszego; oryginalny File Browser nie jest już obsługiwany. Jeśli używasz oryginalnego File Browser, przełącz go w Sklepie: otwórz File Browser, następnie w sekcji Alternatywne implementacje wybierz FileBrowser Quantum i kliknij Przełącz. Twoje pliki i konta zostaną zachowane, ale najpierw wykonaj kopię zapasową File Browser; potem ponownie ustaw ograniczenia folderów przypisane do użytkowników i reguły dostępu oraz utwórz nowe linki udostępniania.',
    fr_FR:
      "Nécessite StartOS 0.4.1 ou une version ultérieure. Le stockage externe FileBrowser nécessite désormais FileBrowser Quantum 2.0.2-stable:3 ou une version ultérieure ; le File Browser d'origine n'est plus pris en charge. Si vous utilisez le File Browser d'origine, changez-le dans la Bibliothèque de services : ouvrez File Browser, puis sous Implémentations alternatives choisissez FileBrowser Quantum et sélectionnez Changer. Vos fichiers et comptes sont conservés, mais sauvegardez d'abord File Browser ; ensuite, réappliquez les restrictions de dossier par utilisateur et les règles d'accès, puis recréez les liens de partage.",
  },
  migrations: {
    up: async () => {},
    down: IMPOSSIBLE,
  },
})
