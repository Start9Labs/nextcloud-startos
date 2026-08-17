import { VersionGraph } from '@start9labs/start-sdk'
import { current } from './current'
import { v_32_0_11_0 } from './v32.0.11.0'
import { v_33_0_8_2 } from './v33.0.8_2'

export const versionGraph = VersionGraph.of({
  current,
  other: [v_32_0_11_0, v_33_0_8_2],
})
