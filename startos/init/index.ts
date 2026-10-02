import { actions } from '../actions'
import { restoreInit } from '../backups'
import { setDependencies } from '../dependencies'
import { setInterfaces } from '../interfaces'
import { sdk } from '../sdk'
import { versionGraph } from '../versions'
import { bootstrapNextcloud, guardUpstreamUpgrade } from './bootstrapNextcloud'
import { reattachUiOnions } from './reattachUiOnions'
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
  reattachUiOnions,
)

export const uninit = sdk.setupUninit(versionGraph)
