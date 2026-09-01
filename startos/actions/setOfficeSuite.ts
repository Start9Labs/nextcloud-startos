import { storeJson } from '../fileModels/store.json'
import { i18n } from '../i18n'
import { isOfficeSuite } from '../officeSuite'
import { sdk } from '../sdk'

const { InputSpec, Value } = sdk

export const inputSpec = InputSpec.of({
  office_suite: Value.select({
    name: i18n('Office Suite'),
    description: i18n(
      'Which document server opens documents, spreadsheets and presentations in your browser. Collabora Online is recommended: it needs about a quarter of the memory and opens more formats. ONLYOFFICE Docs, from the Community Registry, is worth its size only if you shuttle a large body of style-heavy documents back and forth with Microsoft Office. Install the service first, then its Nextcloud app — Nextcloud Office for Collabora, ONLYOFFICE for ONLYOFFICE Docs — and enable only that one.',
    ),
    default: 'none',
    values: {
      none: i18n('None'),
      collabora: 'Collabora Online (recommended)',
      onlyoffice: 'ONLYOFFICE Docs',
    },
  }),
})

export const setOfficeSuite = sdk.Action.withInput(
  // id
  'set-office-suite',

  // metadata
  async ({ effects }) => ({
    name: i18n('Office Suite'),
    description: i18n(
      'Choose the document server that opens office files in your browser.',
    ),
    warning: null,
    allowedStatuses: 'any',
    group: null,
    visibility: 'enabled',
  }),

  // form input specification
  inputSpec,

  // optionally pre-fill the input form
  async ({ effects }) => {
    const officeSuite = await storeJson.read((s) => s.officeSuite).once()
    return {
      office_suite: isOfficeSuite(officeSuite) ? officeSuite : ('none' as const),
    }
  },

  // the execution function
  async ({ effects, input }) => {
    // `main` reads this, resolves the document server's bridge address and
    // reconciles the connector app's settings; setDependencies reads it to add
    // or drop the dependency.
    await storeJson.merge(effects, {
      officeSuite:
        input.office_suite === 'none' ? undefined : input.office_suite,
    })
  },
)
