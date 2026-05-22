import { i18n } from '../../i18n'
import { queuedTaskAction } from '../queuedTask'

export const repair = queuedTaskAction('repair', 'repair', {
  name: i18n('Repair'),
  description: i18n(
    'Runs the built-in Nextcloud repair routine. Fixes database inconsistencies, stale cache entries, and broken shares. Run this if files appear missing, shares return errors, or after a crash or abrupt shutdown.',
  ),
  warning: null,
  allowedStatuses: 'any',
  group: 'Maintenance',
  visibility: 'enabled',
})
