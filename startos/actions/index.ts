import { sdk } from '../sdk'
import { resetPassword } from './resetPassword'
import { setConfig } from './setConfig'
import { setPrimaryUrl } from './setPrimaryUrl'

export const actions = sdk.Actions.of()
  .addAction(setConfig)
  .addAction(resetPassword)
  .addAction(setPrimaryUrl)
