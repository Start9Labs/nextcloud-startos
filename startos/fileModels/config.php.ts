import { FileHelper, z } from '@start9labs/start-sdk'
import { sdk } from '../sdk'
import { locales, phoneRegions } from '../utils'

const shape = z.object({
  dbtype: z.literal('pgsql').catch('pgsql'),
  dbname: z.literal('nextcloud').catch('nextcloud'),
  dbhost: z.literal('localhost').catch('localhost'),
  dbport: z.literal('').catch(''),
  dbtableprefix: z.literal('oc_').catch('oc_'),
  dbuser: z.literal('nextcloud').catch('nextcloud'),
  dbpassword: z.string().optional().catch(undefined),
  trusted_proxies: z
    .tuple([z.literal('10.0.3.0/24')])
    .catch(['10.0.3.0/24'] as const),
  trusted_domains: z.array(z.string()),
  default_locale: z
    .enum(Object.keys(locales) as [string, ...string[]])
    .catch('en_US'),
  default_phone_region: z
    .enum(Object.keys(phoneRegions) as [string, ...string[]])
    .catch('US'),
  maintenance_window_start: z.number().int().min(0).catch(24),
  overwriteprotocol: z.null().optional().catch(undefined),
  'memcache.local': z
    .literal('\\OC\\Memcache\\APCu')
    .catch('\\OC\\Memcache\\APCu'),
  'memcache.distributed': z
    .literal('\\OC\\Memcache\\Redis')
    .catch('\\OC\\Memcache\\Redis'),
  'memcache.locking': z
    .literal('\\OC\\Memcache\\Redis')
    .catch('\\OC\\Memcache\\Redis'),
  redis: z
    .object({
      host: z.literal('localhost').catch('localhost'),
      port: z.literal(6379).catch(6379),
    })
    .catch({ host: 'localhost', port: 6379 }),
  updatechecker: z.literal(false).catch(false),
  check_for_working_wellknown_setup: z.literal(true).catch(true),
  'filelocking.enabled': z.literal(true).catch(true),
  'integrity.check.disabled': z.literal(true).catch(true),
  'updater.server.url': z
    .literal('nextcloud.startos')
    .catch('nextcloud.startos'),
  datadirectory: z
    .literal('/var/www/html/data')
    .catch('/var/www/html/data'),
  'overwrite.cli.url': z.string().optional().catch(undefined),
  'htaccess.RewriteBase': z.string().optional().catch(undefined),
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

export const configPhp = FileHelper.raw<z.infer<typeof shape>>(
  { base: sdk.volumes.nextcloud, subpath: './config/config.php' },
  (dataIn) => {
    return '<?php\n$CONFIG = ' + toPhpString(dataIn) + ';'
  },
  (rawData) => {
    console.log('rawData = ', rawData)
    const { parse } = require('./php-parser.js')
    return parse(rawData)
  },
  (x) => shape.parse(x),
)
