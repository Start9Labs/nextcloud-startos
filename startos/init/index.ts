import { sdk } from '../sdk'
import { setDependencies } from '../dependencies'
import { setInterfaces } from '../interfaces'
import { versionGraph } from '../versions'
import { actions } from '../actions'
import { restoreInit } from '../backups'
import { seedFiles } from './initializeNextcloud'
import { bootstrapNextcloud } from './bootstrapNextcloud'

export const init = sdk.setupInit(
  restoreInit,
  versionGraph,
  seedFiles,
  setInterfaces,
  setDependencies,
  actions,
  bootstrapNextcloud,
)

export const uninit = sdk.setupUninit(versionGraph)
