import { FileHelper, z } from '@start9labs/start-sdk'
import { sdk } from '../sdk'
import { locales, phoneRegions, trashRetention } from '../utils'

const UPDATER_SERVER_URL = 'http://updates.disabled.invalid/'

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
  trashbin_retention_obligation: z
    .enum(Object.keys(trashRetention) as [string, ...string[]])
    .catch('auto'),
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
  // `updatechecker: false` already gates every automatic path to the update
  // server, but `occ update:check` is not gated and would reach the real one.
  // RFC 2606 reserves `.invalid`, so this can never resolve.
  'updater.server.url': z.literal(UPDATER_SERVER_URL).catch(UPDATER_SERVER_URL),
  datadirectory: z.literal('/var/www/html/data').catch('/var/www/html/data'),
  'overwrite.cli.url': z.string().optional().catch(undefined),
  'htaccess.RewriteBase': z.string().optional().catch(undefined),
  skeletondirectory: z.string().optional().catch(undefined),
})

// PHP decodes only \\ and \' inside a single-quoted string, so those are the
// only two characters that may be escaped.
function toSingleQuotedLiteral(str: string) {
  return "'" + str.replace(/[\\']/g, (c) => '\\' + c) + "'"
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
    case 'number':
      // `String(Infinity)` is `Infinity`, which PHP reads as an undefined
      // constant and dies on. PHP spells these `INF`, `-INF` and `NAN`.
      if (Number.isFinite(value)) return String(value)
      if (Number.isNaN(value)) return 'NAN'
      return value > 0 ? 'INF' : '-INF'
    default:
      return String(value)
  }
}

const CONFIG_PATH = 'config/config.php'

type PhpParser = {
  parse(text: string, options?: { grammarSource?: string }): unknown
  SyntaxError: new (...args: never[]) => Error & {
    format(sources: { source: string; text: string }[]): string
  }
}

// `main` reads this file before it starts anything, and StartOS retries a failed
// `main` without reporting why, so this is the only account the user gets of a
// config it cannot read.
function logUnreadable(detail: unknown) {
  console.error(`Could not read ${CONFIG_PATH}: ${detail}`)
}

export const configPhp = FileHelper.raw<z.infer<typeof shape>>(
  { base: sdk.volumes.nextcloud, subpath: `./${CONFIG_PATH}` },
  (dataIn) => {
    return '<?php\n$CONFIG = ' + toPhpString(dataIn) + ';'
  },
  (rawData) => {
    const { parse, SyntaxError: PhpSyntaxError } =
      require('./php-parser.js') as PhpParser
    try {
      return parse(rawData, { grammarSource: CONFIG_PATH })
    } catch (e) {
      // Peggy's `format` quotes the offending line under a caret; the bare
      // message says only what it expected.
      logUnreadable(
        e instanceof PhpSyntaxError
          ? e.format([{ source: CONFIG_PATH, text: rawData }])
          : e,
      )
      throw e
    }
  },
  (x) => {
    try {
      return shape.parse(x)
    } catch (e) {
      logUnreadable(e)
      throw e
    }
  },
)
