import { sdk } from '../sdk'
import { getAdminCredentials } from './getAdminCredentials'
import { disableMaintenanceMode } from './disableMaintenanceMode'
import { disableUnstableApps } from './disableUnstableApps'
import { downloadModels } from './downloadModels'
import { indexMemories } from './indexMemories'
import { indexPlaces } from './indexPlaces'
import { resetPassword } from './resetPassword'
import { setConfig } from './setConfig'

export const actions = sdk.Actions.of()
  .addAction(setConfig)
  .addAction(resetPassword)
  .addAction(disableMaintenanceMode)
  .addAction(disableUnstableApps)
  .addAction(downloadModels)
  .addAction(indexMemories)
  .addAction(indexPlaces)
  .addAction(getAdminCredentials)
