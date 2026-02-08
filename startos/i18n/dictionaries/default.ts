export const DEFAULT_LANG = 'en_US'

const dict = {
  // main.ts
  'Starting Nextcloud...': 0,
  'Web Interface': 1,
  'The web interface is ready': 2,
  'The web interface is not ready': 3,

  // interfaces.ts
  'Web UI': 4,
  'The web interface of Nextcloud': 5,
  WebDAV: 6,
  'Addresses for WebDAV syncing': 7,
} as const

/**
 * Plumbing. DO NOT EDIT.
 */
export type I18nKey = keyof typeof dict
export type LangDict = Record<(typeof dict)[I18nKey], string>
export default dict
