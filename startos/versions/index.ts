import { VersionGraph } from '@start9labs/start-sdk'
import { current } from './current'
import { v_34_0_0_0 } from './v34.0.0.0'
import { v_35_0_1_2 } from './v35.0.1.2'

export const priorVersions = [v_35_0_1_2, v_34_0_0_0]

export const versionGraph = VersionGraph.of({
  current,
  other: priorVersions,
})
