import { sdk } from '../sdk'
import { setDependencies } from '../dependencies'
import { setInterfaces } from '../interfaces'
import { versionGraph } from '../install/versionGraph'
import { actions } from '../actions'
import { restoreInit } from '../backups'
import { taskSetPrimaryUrl } from './taskSetPrimaryUrl'

export const init = sdk.setupInit(
  restoreInit,
  versionGraph,
  setInterfaces,
  setDependencies,
  actions,
  taskSetPrimaryUrl,
)

export const uninit = sdk.setupUninit(versionGraph)
