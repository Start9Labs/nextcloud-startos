import { VersionGraph } from '@start9labs/start-sdk'
import { v_31_0_13_0 } from './v31.0.13.0'
import { v_32_0_8_1 } from './v32.0.8.1'

export const versionGraph = VersionGraph.of({
  current: v_32_0_8_1,
  other: [v_31_0_13_0],
})
