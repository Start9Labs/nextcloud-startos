import { FileHelper, z } from '@start9labs/start-sdk'
import { sdk } from '../sdk'

export const ACTION_IDS = [
  'downloadModels',
  'indexMemories',
  'indexPlaces',
] as const
export type ActionId = (typeof ACTION_IDS)[number]

const actionTimestamps = z.object({
  downloadModels: z.number().optional(),
  indexMemories: z.number().optional(),
  indexPlaces: z.number().optional(),
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
