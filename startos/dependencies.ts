import { T } from '@start9labs/start-sdk'
import { externalStorageMeta } from './externalStorage'
import { storeJson } from './fileModels/store.json'
import { sdk } from './sdk'

export const setDependencies = sdk.setupDependencies(async ({ effects }) => {
  const sources =
    (await storeJson.read((s) => s.externalStorages).const(effects)) ?? []

  const deps: T.CurrentDependenciesResult<any> = {}

  // Only require a source while it's selected. `exists` (not `running`) — we
  // only need the source's volume present on disk to mount and read/write it.
  if (sources.includes('filebrowser')) {
    deps['filebrowser'] = {
      kind: 'exists',
      versionRange: externalStorageMeta.filebrowser.versionRange,
    }
  }
  return deps
})
