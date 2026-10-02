import { VersionGraph } from '@start9labs/start-sdk'
import { current } from './current'
import { v_34_0_0_0 } from './v34.0.0.0'

export const priorVersions = [v_34_0_0_0]

export const versionGraph = VersionGraph.of({
  current,
  other: priorVersions,
})
