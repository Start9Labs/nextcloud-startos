import { FileHelper, z } from '@start9labs/start-sdk'
import { sdk } from '../sdk'

export const ACTION_IDS = [
  'downloadModels',
  'indexMemories',
  'indexPlaces',
  'scanFiles',
  'repair',
] as const
export type ActionId = (typeof ACTION_IDS)[number]

const actionTimestamps = z.object({
  downloadModels: z.number().optional(),
  indexMemories: z.number().optional(),
  indexPlaces: z.number().optional(),
  scanFiles: z.number().optional(),
  repair: z.number().optional(),
})

const shape = z.object({
  adminPassword: z.string().optional().catch(undefined),
  actions: z
    .object({
      pending: actionTimestamps.catch({}).default({}),
      completed: actionTimestamps.catch({}).default({}),
    })
    .catch({ pending: {}, completed: {} })
    .default({ pending: {}, completed: {} }),
  // External Storage sources the user has chosen to surface in Nextcloud Files
  // (see startos/externalStorage.ts). DESIRED state: written by the
  // `external-storage` action, read reactively in setupMain/setDependencies.
  // Keep the enum in sync with EXTERNAL_STORAGE_SOURCES.
  externalStorages: z
    .array(z.enum(['filebrowser']))
    .catch([])
    .default([]),
  // Per-source applicable users: source id -> Nextcloud user list. An empty or
  // absent list for a selected source means "all users" (occ `--add-all`).
  // Written by the `external-storage` action, read reactively in setupMain so a
  // change reconfigures just that source's mount applicability.
  externalStorageUsers: z
    .record(z.string(), z.array(z.string()))
    .catch({})
    .default({}),
  // ACTUAL state: an opaque signature of the last successfully-applied config
  // (selected sources + applicable users). The reconcile oneshot compares it to
  // the desired signature and only does occ work when they differ, then writes
  // the new signature. Read NON-reactively (`.once()`) in setupMain — like
  // `actions.completed`, so the oneshot's write never triggers a chain rebuild.
  // A plain string so FileHelper.merge replaces it wholesale.
  externalStoragesConfigured: z.string().catch('').default(''),
  // Advertise the Coturn package to Nextcloud Talk as its STUN/TURN relay.
  // DESIRED state: written by the Configure action, read reactively in
  // setupMain/setDependencies.
  talkTurn: z.boolean().catch(false).default(false),
  // ACTUAL state: the Talk STUN/TURN entries this package last applied, as an
  // opaque signature. Doubles as the record of what to delete on the next
  // change, so nothing the user added by hand is ever touched. Same
  // desired-vs-actual split (and the same non-reactive read) as
  // `externalStoragesConfigured` above.
  talkTurnConfigured: z.string().catch('').default(''),
})

export type Store = z.infer<typeof shape>
export type ActionTimestamps = z.infer<typeof actionTimestamps>

/**
 * True iff `id` has a `pending` timestamp newer than its `completed` timestamp
 * (or no `completed` timestamp at all). Used by actions to short-circuit a
 * second invocation while a task is queued or running, and by setupMain to
 * decide which tasks to run on each chain build.
 */
export function isPending(
  pending: ActionTimestamps,
  completed: ActionTimestamps,
  id: ActionId,
): boolean {
  const p = pending[id]
  const c = completed[id]
  return p != null && (c == null || c < p)
}

export const storeJson = FileHelper.json(
  { base: sdk.volumes.main, subpath: './store.json' },
  shape,
)
