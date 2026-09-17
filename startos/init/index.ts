import { actions } from '../actions'
import { restoreInit } from '../backups'
import { setDependencies } from '../dependencies'
import { setInterfaces } from '../interfaces'
import { sdk } from '../sdk'
import { versionGraph } from '../versions'
import { bootstrapNextcloud, guardUpstreamUpgrade } from './bootstrapNextcloud'
import { seedFiles } from './seedFiles'

export const init = sdk.setupInit(
  restoreInit,
  guardUpstreamUpgrade,
  versionGraph,
  seedFiles,
  setInterfaces,
  setDependencies,
  actions,
  bootstrapNextcloud,
)

export const uninit = sdk.setupUninit(versionGraph)
