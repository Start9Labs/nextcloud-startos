import { VersionGraph } from '@start9labs/start-sdk'
import { current, other } from './versions'
import { sdk } from '../sdk'
import { storeJson } from '../fileModels/store.json'
import { NEXTCLOUD_DIR, PGDATA, storeDefaults } from '../utils'

export const versionGraph = VersionGraph.of({
  current,
  other,
  preInstall: async (effects) => {
    await storeJson.write(effects, storeDefaults)
    await sdk.SubContainer.withTemp(
      effects,
      { imageId: 'nextcloud' },
      sdk.Mounts.of().mountAssets({ subpath: null, mountpoint: '/scripts' }),
      'nextcloud-init',
      (subc) =>
        subc.execFail([
          `PGDATA=${PGDATA}`,
          `NEXTCLOUD_PATH=${NEXTCLOUD_DIR}`,
          'nextcloud-init.sh',
        ]),
    )
  },
})
