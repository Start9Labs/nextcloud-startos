import { setPrimaryUrl } from '../actions/setPrimaryUrl'
import { storeJson } from '../fileModels/store.json'
import { sdk } from '../sdk'

export const taskSetPrimaryUrl = sdk.setupOnInit(async (effects) => {
  if (!(await storeJson.read((s) => s.url).const(effects))) {
    await sdk.action.createOwnTask(effects, setPrimaryUrl, 'critical', {
      reason:
        'Nextcloud requires a primary URL for the purpose of creating links, sending invites, etc.',
    })
  }
})
