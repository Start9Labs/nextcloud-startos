import { isPending, storeJson } from '../../fileModels/store.json'
import { i18n } from '../../i18n'
import { sdk } from '../../sdk'

export const repair = sdk.Action.withoutInput(
  // id
  'repair',

  // metadata
  {
    name: i18n('Repair'),
    description: i18n(
      'Runs the built-in Nextcloud repair routine. Fixes database inconsistencies, stale cache entries, and broken shares. Run this if files appear missing, shares return errors, or after a crash or abrupt shutdown.',
    ),
    warning: null,
    allowedStatuses: 'any',
    group: 'Maintenance',
    visibility: 'enabled',
  },

  // the execution function
  async ({ effects }) => {
    const store = await storeJson.read().once()
    if (
      isPending(
        store?.actions.pending ?? {},
        store?.actions.completed ?? {},
        'repair',
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
      actions: { pending: { repair: Date.now() } },
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
