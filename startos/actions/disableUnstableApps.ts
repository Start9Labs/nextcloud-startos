import { sdk } from '../sdk'
import { nextcloudMount } from '../utils'

export const disableUnstableApps = sdk.Action.withoutInput(
  // id
  'disable-unstable-apps',

  // metadata
  async ({ effects }) => ({
    name: 'Disable Non-default Apps',
    description:
      'Use this if unstable apps were installed resulting in the UI becoming inaccessible with an Internal Server Error: "The server was unable to complete your request".',
    warning:
      'Running this action will disable ALL non-default app(s). Stable apps will need to be individually re-enabled.',
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
          'cloud_federation_api',
          'comments',
          'contactsinteraction',
          'dashboard',
          'dav',
          'federatedfilesharing',
          'federation',
          'files',
          'files_downloadlimit',
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
          'systemtags',
          'text',
          'theming',
          'twofactor_backupcodes',
          'updatenotification',
          'user_status',
          'viewer',
          'weather_status',
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
      title: 'Success',
      message: `The following apps have been disabled: <ul>${disabledApps.map((app) => `<li>${app}</li>`)}</ul>`,
      result: null,
    }
  },
)
