import { T } from '@start9labs/start-sdk'
import {
  EXTERNAL_STORAGE_SOURCES,
  ExternalStorageSource,
  externalStorageMeta,
} from '../externalStorage'
import { storeJson } from '../fileModels/store.json'
import { i18n } from '../i18n'
import { sdk } from '../sdk'
import { nextcloudMount } from '../utils'

const { InputSpec, Value, Variants } = sdk

// Live Nextcloud user list (uid -> display name). Reads via occ, so the action
// is only-running (like Reset Admin Password).
async function listUsers(effects: T.Effects): Promise<Record<string, string>> {
  const res = await sdk.SubContainer.withTemp(
    effects,
    { imageId: 'nextcloud' },
    nextcloudMount,
    'list-users-external-storage',
    async (subc) =>
      subc.execFail(
        ['php', 'occ', 'user:list', '--limit=1000', '--output=json'],
        { user: 'www-data' },
      ),
  )
  return JSON.parse(res.stdout as string) as Record<string, string>
}

// One self-contained control per source: a dropdown that both enables the
// source and — only under "specific users" — reveals its user picker, so no
// user picker is ever shown for a source you aren't scoping. `name` is the
// already-i18n'd source label. Off = not surfaced; All = everyone; Specific =
// exactly the picked users (≥1).
const sourceUnion = (name: string) =>
  Value.union({
    name,
    description: null,
    default: 'off',
    variants: Variants.of({
      off: { name: i18n('Not mounted'), spec: InputSpec.of({}) },
      all: { name: i18n('Available to all users'), spec: InputSpec.of({}) },
      specific: {
        name: i18n('Available to specific users'),
        spec: InputSpec.of({
          users: Value.dynamicMultiselect(async ({ effects }) => ({
            name: i18n('Users'),
            description: null,
            default: [],
            minLength: 1,
            values: await listUsers(effects),
          })),
        }),
      },
    }),
  })

// The union value <-> stored (enabled + users) translation.
type UnionVal =
  | { selection: 'off'; value: {} }
  | { selection: 'all'; value: {} }
  | { selection: 'specific'; value: { users: string[] } }
const toUnion = (enabled: boolean, users: string[]): UnionVal =>
  !enabled
    ? { selection: 'off', value: {} }
    : users.length === 0
      ? { selection: 'all', value: {} }
      : { selection: 'specific', value: { users } }
const toState = (u: { selection: string; value: { users?: string[] } }) =>
  u.selection === 'all'
    ? { enabled: true, users: [] as string[] }
    : u.selection === 'specific'
      ? { enabled: true, users: u.value.users ?? [] }
      : { enabled: false, users: [] as string[] }

// The registered sources whose backing service is currently installed — only
// these are offered in the form, so uninstalled services never clutter it.
async function installedSources(
  effects: T.Effects,
): Promise<ExternalStorageSource[]> {
  const installed = await effects.getInstalledPackages()
  return EXTERNAL_STORAGE_SOURCES.filter((id) =>
    installed.includes(externalStorageMeta[id].packageId),
  )
}

export const externalStorage = sdk.Action.withInput(
  // id
  'external-storage',

  // metadata
  async ({ effects }) => ({
    name: i18n('External Storage'),
    description: i18n(
      "Show other StartOS services' files as folders in Nextcloud Files, via the built-in External Storage app.",
    ),
    warning: null,
    // Only-running: the user pickers read the live Nextcloud user list via occ.
    allowedStatuses: 'only-running',
    group: null,
    visibility: 'enabled',
  }),

  // form: one dropdown per INSTALLED source (built dynamically from effects)
  async ({ effects }) => {
    const ids = await installedSources(effects)
    return InputSpec.of(
      Object.fromEntries(
        ids.map((id) => [id, sourceUnion(i18n(externalStorageMeta[id].label))]),
      ),
    )
  },

  // pre-fill each shown source's dropdown from the current state
  async ({ effects }) => {
    const ids = await installedSources(effects)
    const sources =
      (await storeJson.read((s) => s.externalStorages).const(effects)) ?? []
    const users =
      (await storeJson.read((s) => s.externalStorageUsers).const(effects)) ?? {}
    return Object.fromEntries(
      ids.map((id) => [id, toUnion(sources.includes(id), users[id] ?? [])]),
    )
  },

  // persist: translate each shown dropdown back into externalStorages +
  // per-source users (the shape setupMain's reconcile consumes). Sources that
  // weren't shown (service not installed) are left out — so uninstalling a
  // service and re-saving drops its selection rather than leaving a broken mount.
  async ({ effects, input }) => {
    const dropdowns = input as Record<string, UnionVal | undefined>
    const externalStorages: ExternalStorageSource[] = []
    const externalStorageUsers: Record<string, string[]> = {}
    for (const id of EXTERNAL_STORAGE_SOURCES) {
      const u = dropdowns[id]
      if (!u) continue
      const state = toState(u)
      if (state.enabled) externalStorages.push(id)
      externalStorageUsers[id] = state.users
    }
    await storeJson.merge(effects, { externalStorages, externalStorageUsers })
  },
)
