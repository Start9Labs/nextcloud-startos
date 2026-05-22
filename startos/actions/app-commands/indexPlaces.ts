import { i18n } from '../../i18n'
import { requireNextcloudApp } from '../../utils'
import { queuedTaskAction } from '../queuedTask'

export const indexPlaces = queuedTaskAction(
  'index-places',
  'indexPlaces',
  {
    name: i18n('Setup Map for Memories'),
    description: i18n(
      'Triggers a background download of map data and a re-index for reverse geotagging your photos in the Memories app. You must install the Memories app before running this action.',
    ),
    warning: i18n(
      'Downloads approximately 2-3 GB of geometry data (~561,000 places). On a low-resource device, avoid running other intensive processes at the same time.',
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
