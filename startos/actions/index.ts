import { sdk } from '../sdk'
import { setConfig } from './setConfig'

export const actions = sdk.Actions.of()
  .addAction(setConfig)
