import { T } from '@start9labs/start-sdk'
import { externalStorageMeta } from './externalStorage'
import { manifest } from './manifest'
import { storeJson } from './fileModels/store.json'
import { sdk } from './sdk'
import { officeSuiteMeta } from './officeSuite'
import { coturnId, coturnVersionRange } from './utils'

export const setDependencies = sdk.setupDependencies(async ({ effects }) => {
  const sources =
    (await storeJson.read((s) => s.externalStorages).const(effects)) ?? []
  const talkTurn = await storeJson.read((s) => s.talkTurn).const(effects)
  const officeSuite = await storeJson.read((s) => s.officeSuite).const(effects)

  const deps: T.CurrentDependenciesResult<typeof manifest> = {}

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
  // The document server has to be up before Nextcloud can hand it a document,
  // and its own health check is the readiness signal.
  if (officeSuite) {
    const meta = officeSuiteMeta[officeSuite]
    deps[meta.packageId] = {
      kind: 'running',
      versionRange: meta.versionRange,
      healthChecks: [meta.healthCheckId],
    }
  }
  return deps
})
