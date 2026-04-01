import { i18n } from '../i18n'
import { sdk } from '../sdk'
import { nextcloudMount } from '../utils'

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
      'Running this action will disable ALL non-default app(s). Stable apps will need to be individually re-enabled.',
    ),
    allowedStatuses: 'only-running',
    group: null,
    visibility: 'enabled',
  }),

  // the execution function
  async ({ effects }) => {
    const disabledApps: string[] = []
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

        const res = await sub.execFail(
          ['php', 'occ', 'app:list', '--enabled', '--output=json'],
          { user: 'www-data' },
        )

        const parsed = JSON.parse(res.stdout as string) as {
          enabled: Record<string, string>
        }

        await Promise.all(
          Object.keys(parsed.enabled).map((app) => {
            if (!defaultApps.includes(app)) {
              disabledApps.push(app)
              return sub.execFail(['php', 'occ', 'app:disable', app], {
                user: 'www-data',
              })
            }
          }),
        )
      },
    )

    return {
      version: '1',
      title: i18n('Success'),
      message: `${i18n('The following apps have been disabled:')} <ul>${disabledApps.map((app) => `<li>${app}</li>`)}</ul>`,
      result: null,
    }
  },
)
