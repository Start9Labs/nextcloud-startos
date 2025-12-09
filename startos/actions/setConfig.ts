import { sdk } from '../sdk'
import { locales, phoneRegions, configDefaults } from '../utils'
import { configPhp } from '../fileModels/config.php'

const { InputSpec, Value } = sdk

export const inputSpec = InputSpec.of({
  default_locale: Value.select({
    name: 'Default locale',
    description:
      'This sets the locale on your Nextcloud server.  It overrides automatic locale detection on public pages like login or shared items. User\'s locale preferences configured under "personal -> locale" override this setting after they have logged in.',
    default: configDefaults.default_local,
    values: locales,
  }),
  default_phone_region: Value.select({
    name: 'Default Phone Region',
    description:
      'This sets the default locale on your Nextcloud server.  It overrides automatic locale detection on public pages like login or shared items. User\'s locale preferences configured under "personal -> locale" override this setting after they have logged in.',
    default: configDefaults.default_phone_region,
    values: phoneRegions,
  }),
  maintenance_window_start: Value.number({
    name: 'Maintenance Window Start Time',
    description:
      'UTC start time for non-time sensitive background jobs. Setting this to a low-usage time frees up resources during the rest of the day by only running these non-time sensitive jobs in the 4 hours following the specified start time. Set to 24 (default) if there is no preference for when these jobs are run, but beware that resource intensive jobs may then run unnecessarily during high usage periods. This may lead to slower performance and a lower quality user experience.',
    default: 24,
    integer: true,
    min: 0,
    max: 24,
    required: true,
  }),
})

export const setConfig = sdk.Action.withInput(
  // id
  'set-config',

  // metadata
  async ({ effects }) => ({
    name: 'Configure',
    description: 'Basic configuration options for your Nextcloud instance',
    warning: null,
    allowedStatuses: 'any',
    group: null,
    visibility: 'enabled',
  }),

  // form input specification
  inputSpec,

  // optionally pre-fill the input form
  async ({ effects }) => configPhp.read().once() as any,

  // the execution function
  async ({ effects, input }) => {
    await configPhp.merge(effects, input)
  },
)
