import { sdk } from '../sdk'
import { nextcloudMount, NEXTCLOUD_PATH } from '../utils'

export const indexMemories = sdk.Action.withoutInput(
  // id
  'index-memories',

  // metadata
  async ({ effects }) => ({
    name: 'Index Media for Memories',
    description:
      'Indexes all media for the Memories media app and enables video support and previews. Indexing is now done automatically by Memories when Nextcloud background tasks are triggered (every 5min by default), so you only need to use this if you want to force a re-index, or do not want to wait for the initial index. You MUST install the Memories app and select your media path (on the Memories welcome screen) before running this Action.',
    warning: null,
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
      'index-memories-sub',
      async (sub) => {
        await sub.execFail([
          'sudo',
          '-u',
          'www-data',
          'php',
          `${NEXTCLOUD_PATH}/occ`,
          'memories:index',
        ])
      },
    )

    return {
      version: '1',
      title: 'Success',
      message:
        'Photos have been indexed for the Memories application. You may need to restart your Nextcloud service if changes do not take effect right away.',
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
