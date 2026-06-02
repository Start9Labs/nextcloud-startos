import { VersionGraph } from '@start9labs/start-sdk'
import { current } from './current'
import { v_31_0_13_0 } from './v31.0.13.0'

export const versionGraph = VersionGraph.of({
  current,
  other: [v_31_0_13_0],
})
