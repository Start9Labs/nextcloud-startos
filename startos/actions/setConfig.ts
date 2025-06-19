import { sdk } from '../sdk'
import { storeJson } from '../fileModels/store.json'
import { locales, phoneRegion, storeDefaults } from '../utils'

const { InputSpec, Value } = sdk

export const inputSpec = InputSpec.of({
  maxBodySize: Value.number({
    name: 'Max Body Size',
    description:
      'Maximum upload file size for WebDAV (set to 0 for an unlimited upload size).  You may want to raise this value if you are having issues with WebDAV uploads.',
    required: true,
    integer: true,
    min: 0,
    max: 65536,
    units: 'MiB',
    default: storeDefaults.maxBodySize,
  }),
  locale: Value.select({
    name: 'Default locale',
    description:
      'This sets the default locale on your Nextcloud server.  It overrides automatic locale detection on public pages like login or shared items. User\'s locale preferences configured under "personal -> locale" override this setting after they have logged in.',
    default: storeDefaults.locale,
    values: locales,
  }),
  phoneRegion: Value.select({
    name: 'Default phone region',
    description:
      'This sets the default locale on your Nextcloud server.  It overrides automatic locale detection on public pages like login or shared items. User\'s locale preferences configured under "personal -> locale" override this setting after they have logged in.',
    default: storeDefaults.phoneRegion,
    values: phoneRegion,
  }),
  maintenanceWindowStart: Value.number({
    name: 'Maintenance Window Start',
    description:
      'UTC Start Time for non-time sensitive background jobs. Setting this to a low-useage time frees up resources during the rest of the day by only running these non-time sensitive jobs in the 4 hours following the specified start time. Set to 24 (default) if there is no preference for when these jobs are run, but beware that resource intensive jobs may then run unnecessarily during high usage periods. This may lead to slower performance and a lower quality user experience.',
      default: 24,
      integer: true,
      min: 0,
      max: 24,
      required: true
  }),
})

export const setConfig = sdk.Action.withInput(
  // id
  'set-config',

  // metadata
  async ({ effects }) => ({
    name: 'Set configuration options',
    description: 'User exposed options for your Nextcloud instance',
    warning: null,
    allowedStatuses: 'any',
    group: null,
    visibility: 'enabled',
  }),

  // form input specification
  inputSpec,

  // optionally pre-fill the input form
  async ({ effects }) => storeJson.read().const(effects),

  // the execution function
  async ({ effects, input }) => {
    await storeJson.merge(effects, input)
  },
)
