import { i18n } from '../../i18n'
import { sdk } from '../../sdk'
import { nextcloudMount } from '../../utils'

export const disableMaintenanceMode = sdk.Action.withoutInput(
  // id
  'disable-maintenance',

  // metadata
  async ({ effects }) => ({
    name: i18n('Disable Maintenance Mode'),
    description: i18n(
      'Use this if the UI is stuck in "Maintenance Mode" for more than 15 minutes. Brief maintenance mode is normal after updates (including some Nextcloud app updates) or restarts — wait first before resorting to this action.',
    ),
    warning: null,
    allowedStatuses: 'only-running',
    group: 'Maintenance',
    visibility: 'enabled',
  }),

  // the execution function
  async ({ effects }) => {
    await sdk.SubContainer.withTemp(
      effects,
      { imageId: 'nextcloud' },
      nextcloudMount,
      'disable-maintenance-sub',
      async (sub) => {
        await sub.execFail(['php', 'occ', 'maintenance:mode', '--off'], {
          user: 'www-data',
        })
      },
    )

    return {
      version: '1',
      title: i18n('Success'),
      message: i18n(
        'Maintenance Mode has been disabled. You may need to wait 1-2 minutes and refresh the browser',
      ),
      result: null,
    }
  },
)
