import { i18n } from '../../i18n'
import { requireNextcloudApp } from '../../utils'
import { queuedTaskAction } from '../queuedTask'

export const indexMemories = queuedTaskAction(
  'index-memories',
  'indexMemories',
  {
    name: i18n('Index Media for Memories'),
    description: i18n(
      'Triggers a background re-index of media for the Memories app. Indexing normally runs every 5 minutes via Nextcloud background jobs; use this only to force a re-index. You must install the Memories app and select your media path before running this action.',
    ),
    warning: i18n(
      'Forces a full media re-index and restarts the service. Memories already re-indexes itself every 5 minutes via background jobs.',
    ),
    allowedStatuses: 'any',
    group: 'App Commands',
    visibility: 'enabled',
  },
  () =>
    requireNextcloudApp(
      'memories',
      i18n('Install the Memories app in Nextcloud first.'),
    ),
)
