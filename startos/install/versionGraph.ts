import { VersionGraph } from '@start9labs/start-sdk'
import { current, other } from './versions'
import { sdk } from '../sdk'

export const versionGraph = VersionGraph.of({
  current,
  other,
  preInstall: async (effects) => {
    await sdk.SubContainer.withTemp(
      effects,
      { imageId: 'nextcloud' },
      sdk.Mounts.of().mountAssets({ subpath: null, mountpoint: '/scripts' }),
      'nextcloud-init',
      (subc) => subc.execFail(['nextcloud-init.sh']),
    )
  },
})
