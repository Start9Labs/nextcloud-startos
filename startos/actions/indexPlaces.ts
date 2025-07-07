import { sdk } from '../sdk'
import { NEXTCLOUD_DIR } from '../utils'

export const indexPlaces = sdk.Action.withoutInput(
  // id
  'index-places',

  // metadata
  async ({ effects }) => ({
    name: 'Setup Map for Memories',
    description:
      'This sets up the map for reverse geotagging (finding the location of) your photos in the Memories application. This mostly consists of downloading map data.  A re-index will be triggered at the end of this process. You MUST install the Memories app before running this Action.',
    warning:
      "This is an intensive process that will require non-trivial system resources and time. If you are on a device with lower resources, it is best to not perform other intensive processes (such as Bitcoin's initial blockchain download) at the same time. This action will consume approximately 2-3 GB of disk space, and you can check progress by viewing the amount of geometries populated to the database under Admin Settings -> Memories -> Reverse Geotagging (complete set is ~561,000)",
    allowedStatuses: 'only-running',
    group: 'CLI Tools',
    visibility: 'enabled',
  }),

  // the execution function
  async ({ effects }) => {
    await sdk.SubContainer.withTemp(
      effects,
      { imageId: 'nextcloud' },
      sdk.Mounts.of().mountVolume({
        volumeId: 'main',
        subpath: null,
        mountpoint: '/root',
        readonly: false,
      }),
      'maintenance-mode',
      async (sub) => {
        await sub.execFail([
          'sudo',
          '-u',
          'www-data',
          '-E',
          'php',
          `${NEXTCLOUD_DIR}/occ`,
          'memories:places-setup',
        ])
      },
    )

    return {
      version: '1',
      title: 'Success',
      message: `You can now use the Map inside your Memories application.`,
      result: {
        type: 'single',
        value: '',
        masked: false,
        copyable: false,
        qr: false,
      },
    }
  },
)
