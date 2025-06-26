import { utils } from '@start9labs/start-sdk'
import { sdk } from '../sdk'
import { NEXTCLOUD_DIR } from '../utils'

const { InputSpec, Value } = sdk

// @TODO add feature for dynamic value list of all found users

export const inputSpec = InputSpec.of({
  user: Value.text({
    name: 'Username',
    default: 'admin',
    required: true
  }),
})

export const resetPassword = sdk.Action.withInput(
  // id
  'reset-password',

  // metadata
  async ({ effects }) => ({
    name: 'Reset User Password',
    description:
      'Reset the password for this user account on your Nextcloud instance',
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
    const password = utils.getDefaultString({
      charset: 'a-z,A-Z,1-9,!,@,$,%,&,*',
      len: 22,
    })

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
          password,
          '|',
          'sudo',
          '-u',
          'www-data',
          '-E',
          'php',
          `${NEXTCLOUD_DIR}/occ`,
          'user:resetpassword',
          input.user,
        ])
      },
    )

    return {
      version: '1',
      title: 'Success',
      message: `Here is the new password for \`${input.user}\`. Save it to a password manager.`,
      result: {
        type: 'single',
        value: password,
        masked: true,
        copyable: true,
        qr: false,
      },
    }
  },
)
