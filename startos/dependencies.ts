import { T } from '@start9labs/start-sdk'
import { externalStorageMeta } from './externalStorage'
import { storeJson } from './fileModels/store.json'
import { sdk } from './sdk'
import { coturnId, coturnVersionRange } from './utils'

export const setDependencies = sdk.setupDependencies(async ({ effects }) => {
  const sources =
    (await storeJson.read((s) => s.externalStorages).const(effects)) ?? []
  const talkTurn = await storeJson.read((s) => s.talkTurn).const(effects)

  const deps: T.CurrentDependenciesResult<any> = {}

  // Only require a source while it's selected. `exists` (not `running`) — we
  // only need the source's volume present on disk to mount and read/write it.
  if (sources.includes('filebrowser')) {
    deps['filebrowser'] = {
      kind: 'exists',
      versionRange: externalStorageMeta.filebrowser.versionRange,
    }
  }
  // Only while the user has asked Talk to use it. No healthChecks: Coturn's own
  // `TURN Server` check fails until a public domain is attached to it, which
  // would surface here as a permanently unmet dependency even though Talk falls
  // back to direct connections. Coturn's own check already names what's missing.
  if (talkTurn) {
    deps[coturnId] = {
      kind: 'running',
      versionRange: coturnVersionRange,
      healthChecks: [],
    }
  }
  return deps
})
