import { configPhp } from '../fileModels/config.php'
import { storeJson } from '../fileModels/store.json'
import { i18n } from '../i18n'
import { sdk } from '../sdk'
import { locales, phoneRegions, trashRetention } from '../utils'

const { InputSpec, Value } = sdk

export const inputSpec = InputSpec.of({
  default_locale: Value.select({
    name: i18n('Default locale'),
    description: i18n(
      'This sets the locale on your Nextcloud server. It overrides automatic locale detection on public pages like login or shared items. User\'s locale preferences configured under "personal -> locale" override this setting after they have logged in.',
    ),
    default: 'en_US',
    values: locales,
  }),
  default_phone_region: Value.select({
    name: i18n('Default Phone Region'),
    description: i18n(
      'This sets the default phone region on your Nextcloud server for formatting and validating phone numbers.',
    ),
    default: 'US',
    values: phoneRegions,
  }),
  trashbin_retention_obligation: Value.select({
    name: i18n('Delete Files in Trash'),
    description: i18n(
      "How long Nextcloud keeps a deleted file in each user's Deleted Files before removing it for good. Restoring a file is only possible while it is still in Deleted Files.\n- Default: kept for at least 30 days, then removed only as disk space is needed, so trash can grow without bound on a server with room to spare.\n- Delete after 7, 30, 90, 180 or 365 days: removed once it has been in Deleted Files that long, or sooner if disk space is needed.\n- Never delete automatically: kept until it is deleted from Deleted Files by hand.",
    ),
    default: 'auto',
    values: trashRetention,
  }),
  maintenance_window_start: Value.number({
    name: i18n('Maintenance Window Start Time'),
    description: i18n(
      'UTC start time for non-time sensitive background jobs. Setting this to a low-usage time frees up resources during the rest of the day by only running these non-time sensitive jobs in the 4 hours following the specified start time. Set to 24 (default) if there is no preference for when these jobs are run, but beware that resource intensive jobs may then run unnecessarily during high usage periods. This may lead to slower performance and a lower quality user experience.',
    ),
    default: 24,
    integer: true,
    min: 0,
    max: 24,
    required: true,
  }),
  disable_skeleton_files: Value.toggle({
    name: i18n('Disable Skeleton Files for New Accounts'),
    description: i18n(
      "When enabled, new user accounts are not seeded with Nextcloud's default skeleton files (sample documents, photos, README, etc.). Existing accounts are unaffected.",
    ),
    default: false,
  }),
  talk_calls: Value.select({
    name: i18n('Talk Calls'),
    description: i18n(
      'How Nextcloud Talk calls connect. Requires the Talk app to be installed in Nextcloud.\n- Direct only: every participant connects to every other. Works for small calls between people who can reach each other.\n- Relay through Coturn: still peer to peer, but calls also connect when participants are behind NAT or a restrictive firewall. Requires Coturn, running with a public domain of its own.\n- High-performance backend: each participant sends their video once and the server forwards it, so calls hold many more people. Requires Nextcloud Talk HPB, running with a public domain on its TURN Relay interface for calls beyond your local network.',
    ),
    default: 'direct',
    values: {
      direct: i18n('Direct only'),
      coturn: i18n('Relay through Coturn'),
      hpb: i18n('High-performance backend'),
    },
  }),
})

export const setConfig = sdk.Action.withInput(
  // id
  'set-config',

  // metadata
  async ({ effects }) => ({
    name: i18n('Configure'),
    description: i18n(
      'Basic configuration options for your Nextcloud instance',
    ),
    warning: null,
    allowedStatuses: 'any',
    group: null,
    visibility: 'enabled',
  }),

  // form input specification
  inputSpec,

  // optionally pre-fill the input form
  async ({ effects }) => {
    // Name every field. Spreading the config carries `dbpassword`,
    // `passwordsalt` and `secret` to whoever opens the form.
    const config = await configPhp.read().once()
    return {
      default_locale: config?.default_locale,
      default_phone_region: config?.default_phone_region,
      trashbin_retention_obligation: config?.trashbin_retention_obligation,
      maintenance_window_start: config?.maintenance_window_start,
      disable_skeleton_files: config?.skeletondirectory === '',
      talk_calls: (await storeJson.read((s) => s.talkCalls).once()) ?? 'direct',
    }
  },

  // the execution function
  async ({ effects, input }) => {
    const { disable_skeleton_files, talk_calls, ...rest } = input
    await configPhp.merge(effects, {
      ...rest,
      skeletondirectory: disable_skeleton_files ? '' : undefined,
    })
    // `main` reads this and reconciles Talk's STUN, TURN and signaling entries;
    // dependencies.ts reads it to pick Coturn, the HPB, or neither.
    await storeJson.merge(effects, { talkCalls: talk_calls })
  },
)
