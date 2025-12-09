import { matches, FileHelper } from '@start9labs/start-sdk'

const { object, string } = matches
const shape = object({
  adminPassword: string.optional().onMismatch(undefined),
})

export const storeJson = FileHelper.json(
  {
    volumeId: 'main',
    subpath: 'store.json',
  },
  shape,
)
