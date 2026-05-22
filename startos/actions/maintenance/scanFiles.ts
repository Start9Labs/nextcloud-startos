import { i18n } from '../../i18n'
import { sdk } from '../../sdk'
import { nextcloudMount } from '../../utils'

export const scanFiles = sdk.Action.withoutInput(
  // id
  'scan-files',

  // metadata
  async ({ effects }) => ({
    name: i18n('Scan Files'),
    description: i18n(
      'Rebuilds the file cache index. Run this after syncing files externally (e.g. via rclone, rsync, or SFTP). Without a scan, externally added or modified files may appear stale, show incorrect sizes, or be missing from search.',
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
      'scan-files-sub',
      async (sub) => {
        await sub.execFail(['php', 'occ', 'files:scan', '--all'], {
          user: 'www-data',
        })
      },
    )

    return {
      version: '1',
      title: i18n('Scan Complete'),
      message: i18n(
        'The file cache has been rebuilt. Externally synced files should now appear correctly in the Nextcloud UI.',
      ),
      result: null,
    }
  },
)
