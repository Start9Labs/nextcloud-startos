import { i18n } from '../../i18n'
import { sdk } from '../../sdk'
import { nextcloudMount } from '../../utils'

export const repair = sdk.Action.withoutInput(
  // id
  'repair',

  // metadata
  async ({ effects }) => ({
    name: i18n('Repair'),
    description: i18n(
      'Runs the built-in Nextcloud repair routine. Fixes database inconsistencies, stale cache entries, and broken shares. Run this if files appear missing, shares return errors, or after a crash or abrupt shutdown.',
    ),
    warning: null,
    allowedStatuses: 'only-running',
    group: 'Maintenance',
    visibility: 'enabled',
  }),

  // execution
  async ({ effects }) => {
    await sdk.SubContainer.withTemp(
      effects,
      { imageId: 'nextcloud' },
      nextcloudMount,
      'repair-sub',
      async (sub) => {
        await sub.execFail(
          ['php', 'occ', 'maintenance:repair', '--no-interaction'],
          { user: 'www-data' },
        )
      },
    )

    return {
      version: '1',
      title: i18n('Repair Complete'),
      message: i18n(
        'Nextcloud has been repaired. If you were experiencing file or sharing issues, they should now be resolved.',
      ),
      result: null,
    }
  },
)
