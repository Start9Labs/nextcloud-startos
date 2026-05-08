import { isPending, storeJson } from '../../fileModels/store.json'
import { i18n } from '../../i18n'
import { sdk } from '../../sdk'
import { requireNextcloudApp } from '../../utils'

export const indexPlaces = sdk.Action.withoutInput(
  // id
  'index-places',

  // metadata
  {
    name: i18n('Setup Map for Memories'),
    description: i18n(
      'Triggers a background download of map data and a re-index for reverse geotagging your photos in the Memories app. You must install the Memories app before running this action.',
    ),
    warning: i18n(
      'Downloads approximately 2-3 GB of geometry data (~561,000 places). On a low-resource device, avoid running other intensive processes at the same time.',
    ),
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
        'indexPlaces',
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
      actions: { pending: { indexPlaces: Date.now() } },
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
