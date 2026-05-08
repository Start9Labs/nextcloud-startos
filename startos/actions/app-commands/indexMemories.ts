import { isPending, storeJson } from '../../fileModels/store.json'
import { i18n } from '../../i18n'
import { sdk } from '../../sdk'
import { requireNextcloudApp } from '../../utils'

export const indexMemories = sdk.Action.withoutInput(
  // id
  'index-memories',

  // metadata
  {
    name: i18n('Index Media for Memories'),
    description: i18n(
      'Triggers a background re-index of media for the Memories app. Indexing normally runs every 5 minutes via Nextcloud background jobs; use this only to force a re-index. You must install the Memories app and select your media path before running this action.',
    ),
    warning: null,
    allowedStatuses: 'any',
    group: 'App Commands',
    visibility: 'enabled',
  },

  // the execution function
  async ({ effects }) => {
    await requireNextcloudApp(
      'memories',
      i18n('Install the Memories app in Nextcloud first.'),
    )
    const store = await storeJson.read().once()
    if (
      isPending(
        store?.actions.pending ?? {},
        store?.actions.completed ?? {},
        'indexMemories',
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
      actions: { pending: { indexMemories: Date.now() } },
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
