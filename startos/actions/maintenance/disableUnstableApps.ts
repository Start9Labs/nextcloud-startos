import { i18n } from '../../i18n'
import { sdk } from '../../sdk'
import { nextcloudMount, readEnabledApps } from '../../utils'

export const disableUnstableApps = sdk.Action.withoutInput(
  // id
  'disable-unstable-apps',

  // metadata
  async ({ effects }) => ({
    name: i18n('Disable Non-default Apps'),
    description: i18n(
      'Use this if unstable apps were installed resulting in the UI becoming inaccessible with an Internal Server Error: "The server was unable to complete your request".',
    ),
    warning: i18n(
      'Disables ALL non-default apps. Stable apps must be re-enabled individually.',
    ),
    allowedStatuses: 'only-running',
    group: 'Maintenance',
    visibility: 'enabled',
  }),

  // the execution function
  async ({ effects }) => {
    const disabledApps: string[] = []
    const failedApps: string[] = []
    await sdk.SubContainer.withTemp(
      effects,
      { imageId: 'nextcloud' },
      nextcloudMount,
      'disable-apps-sub',
      async (sub) => {
        const defaultApps = [
          'activity',
          'admin_audit',
          'app_api',
          'appstore',
          'bruteforcesettings',
          'calendar',
          'circles',
          'cloud_federation_api',
          'comments',
          'contacts',
          'contactsinteraction',
          'dashboard',
          'dav',
          'encryption',
          'federatedfilesharing',
          'federation',
          'files',
          'files_downloadlimit',
          'files_external',
          'files_lock',
          'files_pdfviewer',
          'files_reminders',
          'files_sharing',
          'files_trashbin',
          'files_versions',
          'firstrunwizard',
          'logreader',
          'lookup_server_connector',
          'nextcloud_announcements',
          'notifications',
          'oauth2',
          'office',
          'password_policy',
          'photos',
          'privacy',
          'profile',
          'provisioning_api',
          'recommendations',
          'related_resources',
          'serverinfo',
          'settings',
          'sharebymail',
          'support',
          'survey_client',
          'suspicious_login',
          'systemtags',
          'text',
          'theming',
          'twofactor_backupcodes',
          'twofactor_nextcloud_notification',
          'twofactor_totp',
          'updatenotification',
          'user_ldap',
          'user_status',
          'viewer',
          'weather_status',
          'webhook_listeners',
          'workflowengine',
        ]

        // Sequential, and tolerating failure: `occ app:disable` runs the app's
        // own uninstall repair steps, so a fataling app — the very thing this
        // action exists to escape — can exit non-zero or outlast exec's 30 s
        // timeout. That must cost only its own line in the report.
        for (const app of Object.keys(await readEnabledApps(sub))) {
          if (defaultApps.includes(app)) continue
          const res = await sub.exec(['php', 'occ', 'app:disable', app], {
            user: 'www-data',
          })
          if (res.exitCode === 0) {
            disabledApps.push(app)
          } else {
            failedApps.push(app)
            console.error(
              `disable-unstable-apps: could not disable ${app}: ${res.stdout.toString()} ${res.stderr.toString()}`,
            )
          }
        }
      },
    )

    const list = (apps: string[]) =>
      `<ul>${apps.map((app) => `<li>${app}</li>`).join('')}</ul>`

    return {
      version: '1',
      title: failedApps.length ? i18n('Partially Successful') : i18n('Success'),
      message:
        (disabledApps.length
          ? `${i18n('The following apps have been disabled:')} ${list(disabledApps)}`
          : i18n('No non-default apps were enabled.')) +
        (failedApps.length
          ? `${i18n('These apps could not be disabled. The service logs say why:')} ${list(failedApps)}`
          : ''),
      result: null,
    }
  },
)
