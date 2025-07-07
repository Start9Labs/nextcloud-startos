import { sdk } from '../sdk'
import { disableMaintenanceMode } from './disableMaintenanceMode'
import { disableUnstableApps } from './disableUnstableApps'
import { downloadModels } from './downloadModels'
import { indexMemories } from './indexMemories'
import { indexPlaces } from './indexPlaces'
import { resetPassword } from './resetPassword'
import { setConfig } from './setConfig'
import { setPrimaryUrl } from './setPrimaryUrl'

export const actions = sdk.Actions.of()
  .addAction(setConfig)
  .addAction(resetPassword)
  .addAction(setPrimaryUrl)
  .addAction(disableMaintenanceMode)
  .addAction(disableUnstableApps)
  .addAction(downloadModels)
  .addAction(indexMemories)
  .addAction(indexPlaces)
