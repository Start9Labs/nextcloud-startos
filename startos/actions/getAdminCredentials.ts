import { sdk } from '../sdk'
import { storeJson } from '../fileModels/store.json'

export const getAdminCredentials = sdk.Action.withoutInput(
  // id
  'create-admin-user',

  // metadata
  async ({ effects }) => ({
    name: 'Get Admin Credentials',
    description: '',
    warning: null,
    allowedStatuses: 'only-stopped',
    group: null,
    visibility: 'hidden',
  }),

  // the execution function
  async ({ effects }) => {
    const password = await storeJson.read((s) => s.adminPassword).once()

    storeJson.merge(effects, { adminPassword: undefined })

    return {
      version: '1' as const,
      title: 'Success',
      message:
        'Your admin username and password are below. Write them down or save them to a password manager.',
      result: {
        type: 'group',
        value: [
          {
            type: 'single',
            name: 'Username',
            description: null,
            value: 'admin',
            masked: false,
            copyable: true,
            qr: false,
          },
          {
            type: 'single',
            name: 'Password',
            description: null,
            value: password ?? 'UNKNOWN',
            masked: true,
            copyable: true,
            qr: false,
          },
        ],
      },
    }
  },
)
