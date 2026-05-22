import { isPending, storeJson } from '../../fileModels/store.json'
import { i18n } from '../../i18n'
import { sdk } from '../../sdk'

export const scanFiles = sdk.Action.withoutInput(
  // id
  'scan-files',

  // metadata
  {
    name: i18n('Scan Files'),
    description: i18n(
      'Rebuilds the file cache index. Run this after syncing files externally (e.g. via rclone, rsync, or SFTP). Without a scan, externally added or modified files may appear stale, show incorrect sizes, or be missing from search.',
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
        'scanFiles',
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
      actions: { pending: { scanFiles: Date.now() } },
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
