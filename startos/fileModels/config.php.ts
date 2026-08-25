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
  // `occ` can leave this as a gapped array, which reads back as a map, or as a
  // bare string. Recover the hostnames: any merge that does not carry this key
  // writes the result back, and an empty list locks Nextcloud out of itself.
  trusted_domains: z
    .array(z.string())
    .catch((ctx) =>
      typeof ctx.value === 'string'
        ? [ctx.value]
        : typeof ctx.value === 'object' && ctx.value !== null
          ? Object.values(ctx.value).filter((v) => typeof v === 'string')
          : [],
    ),
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
      // constant and dies on.
      if (Number.isFinite(value)) return String(value)
      if (Number.isNaN(value)) return 'NAN'
      return value > 0 ? 'INF' : '-INF'
    default:
      return String(value)
  }
}

const CONFIG_PATH = 'config/config.php'

type PhpParser = {
  parse(text: string): unknown
  SyntaxError: new (...args: never[]) => Error & {
    location?: { start: { line: number; column: number } }
  }
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
      return parse(rawData)
    } catch (e) {
      // A parse failure otherwise reaches the user as a service that never
      // starts, with no mention of this file. Never log the failing line's
      // text — it holds the database password and the instance secret.
      const at =
        e instanceof PhpSyntaxError && e.location
          ? ` at line ${e.location.start.line}, column ${e.location.start.column}`
          : ''
      console.error(
        `Could not parse ${CONFIG_PATH}${at}: ${e instanceof Error ? e.message : String(e)}`,
      )
      throw e
    }
  },
  (x) => shape.parse(x),
)
