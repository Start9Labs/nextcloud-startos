import { sdk } from '../sdk'
import {
  getBaseDaemons,
  getNextcloudSub,
  getPostgresSub,
  NEXTCLOUD_PATH,
  nextcloudMount,
} from '../utils'

export const chmodAll = sdk.Action.withoutInput(
  // id
  'chmod-all',

  // metadata
  async ({ effects }) => ({
    name: 'Set Folder/File Permissions',
    description: 'Set folder permissions to 755 and files to 644',
    warning: null,
    allowedStatuses: 'only-running',
    group: 'CLI Tools',
    visibility: 'enabled',
  }),

  // the execution function
  async ({ effects }) => {
    await sdk.SubContainer.withTemp(
      effects,
      { imageId: 'nextcloud', sharedRun: true },
      nextcloudMount,
      'chmod',
      async (sub) => {
        const dataPath = `${NEXTCLOUD_PATH}/data`

        await sub.execFail([
          'find',
          dataPath,
          '-type',
          'f',
          '-exec',
          'chmod',
          '644',
          '{}',
          ';',
        ])

        await sub.execFail([
          'find',
          dataPath,
          '-type',
          'd',
          '-exec',
          'chmod',
          '755',
          '{}',
          ';',
        ])

        return null
      },
    )

    return {
      version: '1',
      title: 'Success',
      message: 'Folder/file permissions have been set to 755 and 644',
      result: null,
    }
  },
)
