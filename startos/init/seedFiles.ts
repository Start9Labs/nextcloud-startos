import { storeJson } from '../fileModels/store.json'
import { sdk } from '../sdk'
import { getRandomPassword } from '../utils'

export const seedFiles = sdk.setupOnInit(async (effects, kind) => {
  if (kind === 'install') {
    await storeJson.merge(effects, {
      adminPassword: getRandomPassword(),
    })
  } else {
    await storeJson.merge(effects, {})
  }
})
