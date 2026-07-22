import { sdk } from '../sdk'
import { externalStorage } from './externalStorage'
import { downloadModels } from './app-commands/downloadModels'
import { indexMemories } from './app-commands/indexMemories'
import { indexPlaces } from './app-commands/indexPlaces'
import { getAdminCredentials } from './getAdminCredentials'
import { disableMaintenanceMode } from './maintenance/disableMaintenanceMode'
import { disableUnstableApps } from './maintenance/disableUnstableApps'
import { repair } from './maintenance/repair'
import { resetAdmin } from './maintenance/resetAdmin'
import { scanFiles } from './maintenance/scanFiles'
import { setConfig } from './setConfig'

export const actions = sdk.Actions.of()
  .addAction(setConfig)
  .addAction(externalStorage)
  .addAction(resetAdmin)
  .addAction(disableMaintenanceMode)
  .addAction(disableUnstableApps)
  .addAction(scanFiles)
  .addAction(repair)
  .addAction(downloadModels)
  .addAction(indexMemories)
  .addAction(indexPlaces)
  .addAction(getAdminCredentials)
