import { i18n } from '../i18n'
import { sdk } from '../sdk'
import { nextcloudMount } from '../utils'

export const downloadModels = sdk.Action.withoutInput(
  // id
  'download-models',

  // metadata
  async ({ effects }) => ({
    name: i18n('Download Machine Learning Models for Recognize'),
    description: i18n(
      'This downloads the machine learning models required for identifying objects and faces with the Recognize app. You MUST install the Recognize app in your Nextcloud instance before running this action.',
    ),
    warning: i18n(
      'This process can take up to 15 minutes on a 2023 Server One. It will consume approximately 1-2 GB of disk space.',
    ),
    allowedStatuses: 'only-running',
    group: 'CLI Tools',
    visibility: 'enabled',
  }),

  // the execution function
  async ({ effects }) => {
    await sdk.SubContainer.withTemp(
      effects,
      { imageId: 'nextcloud' },
      nextcloudMount,
      'download-models-sub',
      async (sub) => {
        await sub.execFail(['php', 'occ', 'recognize:download-models'], {
          user: 'www-data',
        })
      },
    )

    return {
      version: '1',
      title: i18n('Success'),
      message: i18n(
        'The machine learning models have been downloaded successfully.',
      ),
      result: null,
    }
  },
)
