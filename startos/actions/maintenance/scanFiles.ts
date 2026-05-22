import { i18n } from '../../i18n'
import { queuedTaskAction } from '../queuedTask'

export const scanFiles = queuedTaskAction('scan-files', 'scanFiles', {
  name: i18n('Scan Files'),
  description: i18n(
    'Rebuilds the file cache index. Run this after syncing files externally (e.g. via rclone, rsync, or SFTP). Without a scan, externally added or modified files may appear stale, show incorrect sizes, or be missing from search.',
  ),
  warning: null,
  allowedStatuses: 'any',
  group: 'Maintenance',
  visibility: 'enabled',
})
