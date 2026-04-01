import { VersionGraph } from '@start9labs/start-sdk'
import { v_31_0_13_0 } from './v31.0.13.0'
import { v_32_0_7_0 } from './v32.0.7.0'

export const versionGraph = VersionGraph.of({
  current: v_32_0_7_0,
  other: [v_31_0_13_0],
})
