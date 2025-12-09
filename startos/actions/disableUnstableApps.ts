import { sdk } from '../sdk'
import { NEXTCLOUD_PATH } from '../utils'

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
      sdk.Mounts.of().mountVolume({
        volumeId: 'main',
        subpath: null,
        mountpoint: '/root',
        readonly: false,
      }),
      'disable-apps',
      async (sub) => {
        const defaultApps = [
          'activity',
          'calendar',
          'circles',
          'cloud_federation_api',
          'comments',
          'contacts',
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

        const enabledAppsRes = await sub.execFail([
          'sh',
          '-c',
          'sudo -u www-data -E php $NEXTCLOUD_DIR/occ app:list | awk "/^Enabled:/ {f=1; next} /^Disabled:/ {f=0} f && /^[[:space:]]+-/ {sub(/:$/, \"\", $2); print $2}"',
        ])

        if (enabledAppsRes.stdout)
          throw new Error(
            `Error fetching enabled apps: ${enabledAppsRes.stdout}`,
          )

        // @TODO remove me after testing
        console.log('***Enabled apps res: ', enabledAppsRes.stdout)
        const enabledApps = enabledAppsRes.stdout.split(',')

        await Promise.all(
          enabledApps.map((app) => {
            if (!defaultApps.includes(app)) {
              disabledApps.push(app)
              return sub.execFail([
                'sudo',
                '-u',
                'www-data',
                '-E',
                'php',
                `${NEXTCLOUD_PATH}/occ`,
                'app:disable',
                app,
              ])
            }
          }),
        )
      },
    )

    return {
      version: '1',
      title: 'Success',
      message: `All Non-default apps have been disabled. Your Nextcloud UI should now be accessible. Disabled Apps: ${disabledApps.join(', ')}`,
      result: {
        type: 'single',
        value: '',
        masked: false,
        copyable: false,
        qr: false,
      },
    }
  },
)
