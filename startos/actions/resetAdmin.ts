import { sdk } from '../sdk'
import { getRandomPassword, nextcloudMount, NEXTCLOUD_PATH } from '../utils'

const { InputSpec, Value } = sdk

export const inputSpec = InputSpec.of({
  user: Value.dynamicSelect(async ({ effects }) => {
    const result = await sdk.SubContainer.withTemp(
      effects,
      { imageId: 'nextcloud' },
      nextcloudMount,
      'list-admin-users',
      async (subc) => {
        const execResult = await subc.execFail([
          'sudo',
          '-u',
          'www-data',
          'php',
          `${NEXTCLOUD_PATH}/occ`,
          'group:list-users',
          'admin',
        ])
        return execResult
      },
    )

    const admins = (result.stdout as string).trim().split('\n')

    return {
      name: 'Admin User',
      default: admins[0],
      values: admins.reduce(
        (obj, name) => ({
          ...obj,
          [name]: name,
        }),
        {},
      ),
    }
  }),
})

export const resetAdmin = sdk.Action.withInput(
  // id
  'reset-admin',

  // metadata
  async ({ effects }) => ({
    name: 'Reset Admin Password',
    description: 'Generate a new password for an admin user',
    warning: null,
    allowedStatuses: 'only-running',
    group: null,
    visibility: 'enabled',
  }),

  // form input specification
  inputSpec,

  // optionally pre-fill form
  async ({ effects }) => {},

  // the execution function
  async ({ effects, input }) => {
    const password = getRandomPassword()

    await sdk.SubContainer.withTemp(
      effects,
      { imageId: 'nextcloud' },
      sdk.Mounts.of().mountVolume({
        volumeId: 'main',
        subpath: null,
        mountpoint: '/root',
        readonly: false,
      }),
      'set-password-occ',
      async (sub) => {
        await sub.execFail([
          'sudo',
          '-u',
          'www-data',
          `OC_PASS="${password}"`,
          'php',
          `${NEXTCLOUD_PATH}/occ`,
          'user:resetpassword',
          '--password-from-env',
          input.user,
        ])
      },
    )

    return {
      version: '1',
      title: 'Success',
      message: 'Your admin user password has been reset',
      result: {
        type: 'group',
        value: [
          {
            type: 'single',
            name: 'Username',
            description: null,
            value: input.user,
            masked: false,
            copyable: true,
            qr: false,
          },
          {
            type: 'single',
            name: 'Password',
            description: null,
            value: password,
            masked: true,
            copyable: true,
            qr: false,
          },
        ],
      },
    }
  },
)
