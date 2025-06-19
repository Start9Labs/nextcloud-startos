import { matches, FileHelper } from '@start9labs/start-sdk'

const { object, string } = matches

const shape = object({
  secretPhrase: string,
  nameLastUpdatedAt: string.nullable().onMismatch(null),
})

export const store = FileHelper.json(
  {
    volumeId: 'main',
    subpath: '/store.json',
  },
  shape,
)
