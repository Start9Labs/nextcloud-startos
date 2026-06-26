import { VersionGraph } from '@start9labs/start-sdk'
import { current } from './current'
import { v_32_0_11_0 } from './v32.0.11.0'

export const versionGraph = VersionGraph.of({
  current,
  other: [v_32_0_11_0],
})
