import { matches, FileHelper } from '@start9labs/start-sdk'
import { configDefaults, locales, phoneRegions } from '../utils'

const { object, string, natural, array, literals } = matches

const { default_local, default_phone_region, maintenance_window_start } =
  configDefaults

const shape = object({
  trusted_proxies: array(string),
  trusted_domains: array(string),
  default_locale: literals(Object.keys(locales).join(', ')).onMismatch(
    default_local,
  ),
  default_phone_region: literals(
    Object.keys(phoneRegions).join(', '),
  ).onMismatch(default_phone_region),
  maintenance_window_start: natural.onMismatch(maintenance_window_start),
  overwrite_protocol: literals('https').onMismatch('https'),
})

function toSingleQuotedLiteral(str: string) {
  return (
    "'" +
    str.replace(/[\u0000-\u001F'\\]/g, (c) => {
      switch (c) {
        case "'":
          return "\\'"
        case '\\':
          return '\\\\'
        case '\n':
          return '\\n'
        case '\r':
          return '\\r'
        case '\t':
          return '\\t'
        default: {
          const code = c.charCodeAt(0).toString(16).padStart(4, '0')
          return '\\u' + code
        }
      }
    }) +
    "'"
  )
}

function toPhpString(value: unknown, indent = 0): string {
  switch (typeof value) {
    case 'object':
      return value == null
        ? 'null'
        : `array (\n${
            Array.isArray(value)
              ? value
                  .filter((x) => x !== undefined)
                  .reduce(
                    (acc, x, idx) =>
                      `${acc}${'  '.repeat(indent + 1)}${idx} => ${toPhpString(x, indent + 1)},\n`,
                    '',
                  )
              : Object.entries(value)
                  .filter(([k, v]) => k !== undefined && v !== undefined)
                  .reduce(
                    (acc, [key, value]) =>
                      `${acc}${'  '.repeat(indent + 1)}${toPhpString(key)} => ${toPhpString(value, indent + 1)},\n`,
                    '',
                  )
          }${'  '.repeat(indent)})`
    case 'string':
      return toSingleQuotedLiteral(value)
    default:
      return String(value)
  }
}

export const configPhp = FileHelper.raw<typeof shape._TYPE>(
  {
    volumeId: 'nextcloud',
    subpath: 'config/config.php',
  },
  (dataIn) => {
    return '<?php\n$CONFIG = ' + toPhpString(dataIn) + ';'
  },
  (rawData) => {
    console.log('rawData = ', rawData)
    const { parse } = require('./php-parser.js')
    return parse(rawData)
  },
  (x) => shape.unsafeCast(x),
)
