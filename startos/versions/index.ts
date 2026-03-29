import { VersionGraph } from '@start9labs/start-sdk'
import { v_31_0_13_0 } from './v31.0.13.0'
import { v_32_0_6_2_b9 } from './v32.0.6.2.b9'

export const versionGraph = VersionGraph.of({
  current: v_32_0_6_2_b9,
  other: [v_31_0_13_0],
})
