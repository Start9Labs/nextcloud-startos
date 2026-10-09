import { setupOnionReattachment } from 'tor-startos/startos/utils/reattach'
import { storeJson } from '../fileModels/store.json'
import { manifest } from '../manifest'
import { sdk } from '../sdk'
import { uiPort } from '../utils'

export const reattachUiOnions = setupOnionReattachment(sdk, {
  packageId: manifest.id,
  hostId: 'main',
  to: { interfaceId: 'ui', internalPort: uiPort, ssl: false },
  pending: storeJson.read((s) => s.reattachUiOnions),
  clear: (effects) =>
    storeJson.merge(
      effects,
      { reattachUiOnions: false },
      { allowWriteAfterConst: true },
    ),
})
