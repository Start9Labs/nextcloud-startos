import { sdk } from '../sdk'
import { NEXTCLOUD_DIR } from '../utils'

export const downloadModels = sdk.Action.withoutInput(
  // id
  'download-models',

  // metadata
  async ({ effects }) => ({
    name: 'Download Machine Learning Models for Recognize',
    description:
      'This downloads the machine learning models required for identifying objects and faces with the Recognize app.  You MUST install the Recognize app in your Nextcloud instance before running this action.',
    warning:
      'This process can take up to 15 minutes on a 2023 Server One.  It will consume approximately 1-2 GB of disk space.',
    allowedStatuses: 'only-running',
    group: 'CLI Tools',
    visibility: 'enabled',
  }),

  // the execution function
  async ({ effects }) => {
    await sdk.SubContainer.withTemp(
      effects,
      { imageId: 'nextcloud' },
      sdk.Mounts.of().mountVolume({
        volumeId: 'main',
        subpath: null,
        mountpoint: '/root',
        readonly: false,
      }),
      'maintenance-mode',
      async (sub) => {
        await sub.execFail([
          'sudo',
          '-u',
          'www-data',
          '-E',
          'php',
          `${NEXTCLOUD_DIR}/occ`,
          'recognize:download-models',
        ])
      },
    )

    return {
      version: '1',
      title: 'Success',
      message: 'The machine learning models have been downloaded successfully.',
      result: {
        type: 'single',
        value: '',
        masked: false,
        copyable: false,
        qr: false,
      },
    }
  },
)
