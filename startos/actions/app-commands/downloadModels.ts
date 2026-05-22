import { i18n } from '../../i18n'
import { requireNextcloudApp } from '../../utils'
import { queuedTaskAction } from '../queuedTask'

export const downloadModels = queuedTaskAction(
  'download-models',
  'downloadModels',
  {
    name: i18n('Download Machine Learning Models for Recognize'),
    description: i18n(
      'Triggers a background download of the machine learning models required for identifying objects and faces with the Recognize app. You must install the Recognize app in Nextcloud before running this action.',
    ),
    warning: i18n(
      'The download can take up to 15 minutes and will consume approximately 1-2 GB of disk space.',
    ),
    allowedStatuses: 'any',
    group: 'App Commands',
    visibility: 'enabled',
  },
  () =>
    requireNextcloudApp(
      'recognize',
      i18n('Install the Recognize app in Nextcloud first.'),
    ),
)
