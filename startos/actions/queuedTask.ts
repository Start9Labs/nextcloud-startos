import { T } from '@start9labs/start-sdk'
import { ActionId, isPending, storeJson } from '../fileModels/store.json'
import { i18n } from '../i18n'
import { sdk } from '../sdk'

type Metadata = Parameters<typeof sdk.Action.withoutInput>[1]

/**
 * Build an action that queues a long-running `occ` task rather than running it
 * inline (which would block the action handler past its timeout). The action
 * records a `pending` timestamp for `taskId` in store.json and returns
 * immediately; the `long-running-tasks` oneshot in main.ts picks it up, runs
 * the command in the main container, and posts a completion notification.
 * `taskId` must therefore have matching entries in main.ts's OCC_ARGS and
 * TASK_NOTICE and a health check. An optional `precheck` runs before queuing —
 * use it to fail fast (e.g. requireNextcloudApp) before recording a flag.
 */
export function queuedTaskAction(
  id: string,
  taskId: ActionId,
  metadata: Metadata,
  precheck?: (effects: T.Effects) => Promise<void>,
) {
  return sdk.Action.withoutInput(id, metadata, async ({ effects }) => {
    if (precheck) await precheck(effects)

    const store = await storeJson.read().once()
    if (
      isPending(
        store?.actions.pending ?? {},
        store?.actions.completed ?? {},
        taskId,
      )
    ) {
      return {
        version: '1',
        title: i18n('Already in Progress'),
        message: i18n('Action is already in progress.'),
        result: null,
      }
    }

    const pending: Partial<Record<ActionId, number>> = { [taskId]: Date.now() }
    await storeJson.merge(effects, { actions: { pending } })

    return {
      version: '1',
      title: i18n('In Progress'),
      message: i18n(
        'Service has been automatically restarted and a new health check created to monitor progress.',
      ),
      result: null,
    }
  })
}
