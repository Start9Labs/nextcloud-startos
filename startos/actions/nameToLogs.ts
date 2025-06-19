import { sdk } from '../sdk'
import { configYaml } from '../fileModels/config.yml'
import { store } from '../fileModels/store.json'
import { setName } from './setName'

export const nameToLogs = sdk.Action.withoutInput(
  // id
  'name-to-logs',

  // metadata
  async ({ effects }) => ({
    name: 'Print name to Logs',
    description: 'Prints "Hello [Name]" to the service logs.',
    warning: null,
    allowedStatuses: 'only-running',
    group: null,
    visibility: (await store.read((s) => s.nameLastUpdatedAt).const(effects))
      ? 'enabled'
      : {
          disabled: 'Cannot print name to logs until you update your name.',
        },
  }),

  // the execution function
  async ({ effects }) => {
    const name = (await configYaml.read().const(effects))!.name
    console.info(`Hello ${name}`)

    return {
      version: '1',
      title: 'Success',
      message: `"Hello ${name}" has been logged. Open the Hello World service logs to view it.`,
      result: null,
    }
  },
)
