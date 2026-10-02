import { ExtendedVersion, IST, T, VersionRange } from '@start9labs/start-sdk'
import { storeJson } from '../fileModels/store.json'
import { manifest } from '../manifest'
import { sdk } from '../sdk'
import { uiPort } from '../utils'

/** Tor releases whose Add Onion Service a service may run for its own hosts. */
const torAttachesForServices = VersionRange.parse('>=0.4.9.13:1')

const urlPluginMetadata = {
  packageId: manifest.id,
  hostId: 'main',
  interfaceId: 'ui',
  internalPort: uiPort,
}

/**
 * Ids of the main host's .onion addresses that Tor's form offers and that no
 * binding of the host already serves.
 */
async function unusedUiOnions(effects: T.Effects): Promise<string[]> {
  const served = await sdk.host
    .get(effects, { hostId: 'main' }, (host) =>
      Object.values(host?.bindings ?? {}).flatMap((b) =>
        b.addresses.available
          .filter(
            (a) =>
              a.metadata.kind === 'plugin' && a.metadata.packageId === 'tor',
          )
          .map((a) => a.hostname),
      ),
    )
    .once()
  const form = await effects.action.getInput({
    packageId: 'tor',
    actionId: 'add-onion-service',
    prefill: { urlPluginMetadata },
  })
  const address = (form?.spec as IST.InputSpec | undefined)?.address
  if (address?.type !== 'union') return []
  return Object.entries(address.variants)
    .filter(
      ([id, { name }]) =>
        id.startsWith(`${manifest.id}/main/`) && !served.includes(name),
    )
    .map(([id]) => id)
}

/**
 * Attaches the main host's unused .onion addresses to the Web UI binding after
 * the retirement of 443 and 8080 left them unused, once Tor lets this service
 * do it.
 */
export const reattachUiOnions = sdk.setupOnInit(async (effects) => {
  const pending = await storeJson.read((s) => s.reattachUiOnions).const(effects)
  if (!pending) return

  const enabled = await sdk.host
    .get(
      effects,
      { hostId: 'main' },
      (host) => host?.bindings[uiPort]?.enabled ?? false,
    )
    .const()
  if (!enabled) return

  const torVersion = await sdk
    .getServiceManifest(effects, 'tor', (m) => m?.version ?? null)
    .const()
  if (
    !torVersion ||
    !ExtendedVersion.parse(torVersion).satisfies(torAttachesForServices)
  )
    return

  try {
    for (const selection of await unusedUiOnions(effects)) {
      await sdk.action.run({
        effects,
        packageId: 'tor',
        actionId: 'add-onion-service',
        prefill: { urlPluginMetadata },
        input: ({ spec }) => ({
          urlPluginMetadata,
          ...('ssl' in spec ? { ssl: false } : {}),
          address: { selection, value: {} },
        }),
      })
    }
    await storeJson.merge(
      effects,
      { reattachUiOnions: false },
      { allowWriteAfterConst: true },
    )
  } catch (e) {
    console.warn(`Web UI .onion addresses not reattached yet: ${String(e)}`)
  }
})
