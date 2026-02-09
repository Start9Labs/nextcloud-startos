import { i18n } from '../i18n'
import { sdk } from '../sdk'
import { getRandomPassword, nextcloudMount } from '../utils'

const { InputSpec, Value } = sdk

export const inputSpec = InputSpec.of({
  user: Value.dynamicSelect(async ({ effects }) => {
    const res = await sdk.SubContainer.withTemp(
      effects,
      { imageId: 'nextcloud' },
      nextcloudMount,
      'list-admin-users',
      async (subc) =>
        subc.execFail(
          ['php', 'occ', 'user:list', '--limit=1000', '--output=json'],
          { user: 'www-data' },
        ),
    )

    const admins = JSON.parse(res.stdout as string) as Record<string, string>

    return {
      name: i18n('Admin User'),
      default: admins[0],
      values: admins,
    }
  }),
})

export const resetAdmin = sdk.Action.withInput(
  // id
  'reset-admin',

  // metadata
  async ({ effects }) => ({
    name: i18n('Reset Admin Password'),
    description: i18n('Generate a new password for an admin user'),
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
    const OC_PASS = getRandomPassword()

    await sdk.SubContainer.withTemp(
      effects,
      { imageId: 'nextcloud' },
      nextcloudMount,
      'set-password-occ',
      async (sub) =>
        sub.execFail(
          [
            'php',
            'occ',
            'user:resetpassword',
            '--password-from-env',
            input.user,
          ],
          { user: 'www-data', env: { OC_PASS } },
        ),
    )

    return {
      version: '1',
      title: i18n('Success'),
      message: i18n('Your admin user password has been reset'),
      result: {
        type: 'group',
        value: [
          {
            type: 'single',
            name: i18n('Username'),
            description: null,
            value: input.user,
            masked: false,
            copyable: true,
            qr: false,
          },
          {
            type: 'single',
            name: i18n('Password'),
            description: null,
            value: OC_PASS,
            masked: true,
            copyable: true,
            qr: false,
          },
        ],
      },
    }
  },
)
