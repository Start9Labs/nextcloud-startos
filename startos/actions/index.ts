import { sdk } from '../sdk'
import { downloadModels } from './app-commands/downloadModels'
import { indexMemories } from './app-commands/indexMemories'
import { indexPlaces } from './app-commands/indexPlaces'
import { getAdminCredentials } from './getAdminCredentials'
import { disableMaintenanceMode } from './maintenance/disableMaintenanceMode'
import { disableUnstableApps } from './maintenance/disableUnstableApps'
import { resetAdmin } from './maintenance/resetAdmin'
import { setConfig } from './setConfig'

export const actions = sdk.Actions.of()
  .addAction(setConfig)
  .addAction(resetAdmin)
  .addAction(disableMaintenanceMode)
  .addAction(disableUnstableApps)
  .addAction(downloadModels)
  .addAction(indexMemories)
  .addAction(indexPlaces)
  .addAction(getAdminCredentials)
