export const OFFICE_SUITES = ['collabora', 'onlyoffice'] as const
export type OfficeSuite = (typeof OFFICE_SUITES)[number]

// Where the ONLYOFFICE document server is mounted under Nextcloud's own origin.
// Collabora needs no prefix — it owns four top-level paths of its own.
export const DS_VPATH = '/ds-vpath'

// `store.json` reads come back widened to `string`, so narrow at the boundary
// rather than trusting the schema's enum downstream.
export const isOfficeSuite = (v: unknown): v is OfficeSuite =>
  typeof v === 'string' && (OFFICE_SUITES as readonly string[]).includes(v)

// Collabora's WOPI discovery document, proxied below and fetched back through
// that proxy by `richdocuments:activate-config`.
export const COLLABORA_DISCOVERY = '/hosting/discovery'

// Every Nextcloud app that handles office documents. richdocuments demotes the
// Microsoft formats out of its default-open list whenever it finds one of the
// others enabled (`CapabilitiesService::hasOtherOOXMLApps`), so a second one
// left enabled silently stops Word, Excel and PowerPoint files opening at all.
export const OFFICE_CONNECTOR_APPS = [
  'richdocuments',
  'onlyoffice',
  'officeonline',
] as const
export type OfficeConnectorApp = (typeof OFFICE_CONNECTOR_APPS)[number]

/** Exactly what each connector is called in Nextcloud's own Apps list. */
export const CONNECTOR_APP_TITLES: Record<OfficeConnectorApp, string> = {
  richdocuments: 'Nextcloud Office (Collabora)',
  onlyoffice: 'ONLYOFFICE',
  officeonline: 'Office Online',
}

export const officeMountpoint = '/mnt/onlyoffice'
export const officeSecretPath = `${officeMountpoint}/jwt-secret`

// The header ONLYOFFICE signs its requests with. Plain `Authorization` collides
// with Nextcloud's own.
export const OO_JWT_HEADER = 'AuthorizationJwt'

export const officeSuiteMeta = {
  collabora: {
    packageId: 'collabora-online',
    versionRange: '>=26.4.3:0',
    hostId: 'main',
    internalPort: 9980,
    // The daemon's id, which is what its `ready` check is named.
    healthCheckId: 'cool',
    title: 'Collabora Online',
    connectorApp: 'richdocuments',
    // What `richdocuments:activate-config` writes, and so what has to be
    // cleared when the selection moves off this backend.
    settingKeys: ['wopi_url', 'wopi_callback_url', 'public_wopi_url'],
  },
  onlyoffice: {
    packageId: 'onlyoffice-docs',
    versionRange: '>=9.4.0:0',
    hostId: 'main',
    internalPort: 80,
    healthCheckId: 'documentserver',
    title: 'ONLYOFFICE Docs',
    connectorApp: 'onlyoffice',
    settingKeys: [
      'DocumentServerUrl',
      'DocumentServerInternalUrl',
      'StorageUrl',
      'jwt_secret',
      'jwt_header',
    ],
  },
} as const satisfies Record<
  OfficeSuite,
  {
    packageId: string
    versionRange: string
    hostId: string
    internalPort: number
    healthCheckId: string
    title: string
    connectorApp: OfficeConnectorApp
    settingKeys: readonly string[]
  }
>

/**
 * The Apache configuration that puts the chosen document server on Nextcloud's
 * own origin. Serving the editor from the address the browser already holds is
 * what lets it work on LAN, a domain and Tor at once, rather than on whichever
 * single address the document server was told to advertise.
 */
export function renderOfficeProxyConf(
  suite: OfficeSuite,
  backend: string,
): string {
  if (suite === 'collabora') {
    return `# StartOS: Collabora Online on Nextcloud's own origin
AllowEncodedSlashes NoDecode
ProxyPreserveHost On

ProxyPass        /browser http://${backend}/browser retry=0
ProxyPassReverse /browser http://${backend}/browser

ProxyPass        ${COLLABORA_DISCOVERY} http://${backend}${COLLABORA_DISCOVERY} retry=0
ProxyPassReverse ${COLLABORA_DISCOVERY} http://${backend}${COLLABORA_DISCOVERY}

ProxyPass        /hosting/capabilities http://${backend}/hosting/capabilities retry=0
ProxyPassReverse /hosting/capabilities http://${backend}/hosting/capabilities

# One rule for everything under /cool. \`upgrade=websocket\` lets mod_proxy
# upgrade the requests that ask for it and pass the rest through as ordinary
# HTTP, which is what makes both of Collabora's socket URL shapes work — a bare
# /cool/ws and a /cool/<url-encoded WOPI source>/ws compat form. \`nocanon\`
# keeps the encoded slashes in that second one intact.
ProxyPass        /cool http://${backend}/cool upgrade=websocket nocanon
ProxyPassReverse /cool http://${backend}/cool

# Collabora writes its own absolute address into the discovery document, and
# Nextcloud copies that URL into the editor frame verbatim. Stripping the origin
# leaves a relative URL, which the browser resolves against whichever address it
# is already on.
<Location ${COLLABORA_DISCOVERY}>
  SetOutputFilter SUBSTITUTE
  Substitute "s#(urlsrc|favIconUrl)=\\"https?://[^/]+/#$1=\\"/#i"
</Location>
`
  }

  return `# StartOS: ONLYOFFICE Docs on Nextcloud's own origin
AllowEncodedSlashes NoDecode
ProxyPreserveHost On

# ONLYOFFICE builds its public URLs from these per request, so the editor
# follows whichever address the browser is already using.
RequestHeader set X-Forwarded-Prefix "${DS_VPATH}"

ProxyPass        ${DS_VPATH}/ http://${backend}/ upgrade=websocket nocanon
ProxyPassReverse ${DS_VPATH}/ http://${backend}/
`
}
