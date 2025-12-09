import { sdk } from '../sdk'
import { NEXTCLOUD_PATH } from '../utils'

export const disableMaintenanceMode = sdk.Action.withoutInput(
  // id
  'disable-maintenance-mode',

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
          `${NEXTCLOUD_PATH}/occ`,
          'maintenance:mode',
          '--off',
        ])
      },
    )

    return {
      version: '1',
      title: 'Success',
      message: `Maintenance Mode has been disabled. You may need to wait 1-2min and refresh your UI page`,
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
