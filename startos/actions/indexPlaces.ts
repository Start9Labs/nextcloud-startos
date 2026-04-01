import { i18n } from '../i18n'
import { sdk } from '../sdk'
import { nextcloudMount } from '../utils'

export const indexPlaces = sdk.Action.withoutInput(
  // id
  'index-places',

  // metadata
  async ({ effects }) => ({
    name: i18n('Setup Map for Memories'),
    description: i18n(
      'This sets up the map for reverse geotagging (finding the location of) your photos in the Memories application. This mostly consists of downloading map data. A re-index will be triggered at the end of this process. You MUST install the Memories app before running this Action.',
    ),
    warning: i18n(
      "This is an intensive process that will require non-trivial system resources and time. If you are on a device with lower resources, it is best to not perform other intensive processes (such as Bitcoin's initial blockchain download) at the same time. This action will consume approximately 2-3 GB of disk space, and you can check progress by viewing the amount of geometries populated to the database under Admin Settings -> Memories -> Reverse Geotagging (complete set is ~561,000)",
    ),
    allowedStatuses: 'only-running',
    group: 'CLI Tools',
    visibility: 'enabled',
  }),

  // the execution function
  async ({ effects }) => {
    await sdk.SubContainer.withTemp(
      effects,
      { imageId: 'nextcloud' },
      nextcloudMount,
      'index-places-sub',
      async (sub) => {
        await sub.execFail(['php', 'occ', 'memories:places-setup'], {
          user: 'www-data',
        })
      },
    )

    return {
      version: '1',
      title: i18n('Success'),
      message: i18n(
        'You can now use the Map inside your Memories application.',
      ),
      result: null,
    }
  },
)
