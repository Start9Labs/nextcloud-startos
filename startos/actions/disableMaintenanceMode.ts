import { sdk } from '../sdk'
import { nextcloudMount } from '../utils'

export const disableMaintenanceMode = sdk.Action.withoutInput(
  // id
  'disable-maintenance',

  // metadata
  async ({ effects }) => ({
    name: 'Disable Maintenance Mode',
    description:
      'Use this if your UI has gotten stuck in "Maintenance Mode". Please keep in mind that it is normal for this mode to engage (temporarily) following an update (including some NC app updates) or restart. The typical solution is to BE PATIENT and allow the opportunity for organic progress.  Resort to this action only if necessary. Being in maintenance mode for more than 15min likely constitutes "being stuck."',
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
      'disable-maintenance-sub',
      async (sub) => {
        await sub.execFail(['php', 'occ', 'maintenance:mode', '--off'], {
          user: 'www-data',
        })
      },
    )

    return {
      version: '1',
      title: 'Success',
      message: `Maintenance Mode has been disabled. You may need to wait 1-2 minutes and refresh the browser`,
      result: null,
    }
  },
)
