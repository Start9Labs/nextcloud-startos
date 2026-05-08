import { isPending, storeJson } from '../../fileModels/store.json'
import { i18n } from '../../i18n'
import { sdk } from '../../sdk'
import { requireNextcloudApp } from '../../utils'

export const downloadModels = sdk.Action.withoutInput(
  // id
  'download-models',

  // metadata
  {
    name: i18n('Download Machine Learning Models for Recognize'),
    description: i18n(
      'Triggers a background download of the machine learning models required for identifying objects and faces with the Recognize app. You must install the Recognize app in Nextcloud before running this action.',
    ),
    warning: i18n(
      'The download can take up to 15 minutes and will consume approximately 1-2 GB of disk space.',
    ),
    allowedStatuses: 'any',
    group: 'App Commands',
    visibility: 'enabled',
  },

  // the execution function
  async ({ effects }) => {
    await requireNextcloudApp(
      'recognize',
      i18n('Install the Recognize app in Nextcloud first.'),
    )
    const store = await storeJson.read().once()
    if (
      isPending(
        store?.actions.pending ?? {},
        store?.actions.completed ?? {},
        'downloadModels',
      )
    ) {
      return {
        version: '1',
        title: i18n('Already in Progress'),
        message: i18n('Action is already in progress.'),
        result: null,
      }
    }

    await storeJson.merge(effects, {
      actions: { pending: { downloadModels: Date.now() } },
    })

    return {
      version: '1',
      title: i18n('In Progress'),
      message: i18n(
        'Service has been automatically restarted and a new health check created to monitor progress.',
      ),
      result: null,
    }
  },
)
