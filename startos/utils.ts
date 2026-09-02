import { sdk } from './sdk'
import { SubContainer, T, utils } from '@start9labs/start-sdk'
import { manifest } from './manifest'

export const uiPort = 80 as const
export const NEXTCLOUD_PATH = '/var/www/html' as const
export const POSTGRES_PATH = '/var/lib/postgresql' as const

export const NEXTCLOUD_VOLUME_HOST = '/media/startos/volumes/nextcloud' as const

/**
 * True if a Nextcloud app's files are present on the volume. Checks both
 * `custom_apps/` (user-installed) and `apps/` (built-in).
 *
 * Presence only, and it needs no database, so it works with the service
 * stopped. An app that is present but disabled passes; where the app's `occ`
 * namespace itself has to exist, use `readEnabledApps`.
 */
export async function hasNextcloudApp(name: string): Promise<boolean> {
  const { stat } = await import('node:fs/promises')
  for (const dir of ['custom_apps', 'apps']) {
    const ok = await stat(`${NEXTCLOUD_VOLUME_HOST}/${dir}/${name}`).then(
      () => true,
      () => false,
    )
    if (ok) return true
  }
  return false
}

/**
 * Throws `errorMessage` if a Nextcloud app's files are not present on the
 * volume. Used by actions that require a prerequisite Nextcloud app — calling
 * this at the top of the action's `run` produces a coherent error in the UI
 * when the app is missing.
 */
export async function requireNextcloudApp(
  name: string,
  errorMessage: string,
): Promise<void> {
  if (!(await hasNextcloudApp(name))) throw new Error(errorMessage)
}

/**
 * The apps Nextcloud currently has enabled, keyed by app id. `occ` registers an
 * app's command namespace only while that app is enabled, and a major upgrade
 * disables any app without a compatible release while leaving its files in
 * place — so a directory on disk says nothing about whether `occ <app>:*` will
 * resolve.
 *
 * Reads the database, so only call this where Postgres is up.
 */
export async function readEnabledApps(
  sub: SubContainer<typeof manifest>,
): Promise<Record<string, string>> {
  const res = await sub.exec(
    ['php', 'occ', 'app:list', '--enabled', '--output=json'],
    { user: 'www-data' },
  )
  const stdout = res.stdout.toString()
  const fail = () =>
    new Error(
      `could not read Nextcloud's enabled app list; occ exited ${res.exitCode}: ${stdout} ${res.stderr.toString()}`,
    )
  if (res.exitCode !== 0) throw fail()
  try {
    // A PHP startup or deprecation notice lands on stdout ahead of occ's JSON.
    const { enabled } = JSON.parse(stdout.slice(stdout.indexOf('{'))) as {
      enabled?: Record<string, string>
    }
    return enabled ?? {}
  } catch {
    throw fail()
  }
}

// Nextcloud Talk's app id, which is also its directory name. Talk is installed
// by the user from the Nextcloud app store.
export const TALK_APP = 'spreed'

// The external Coturn package Talk relays calls through.
export const coturnId = 'coturn'
export const coturnVersionRange = '>=4.14.0:0'
export const coturnHostId = 'turn'
export const coturnInterfaceId = 'turn'
// Coturn publishes its shared secret at `shared/turn-secret` on its `main`
// volume. Mounting that subpath alone keeps the rest of that volume —
// turnserver.conf, which holds the same secret in plaintext, and the coturn
// database — out of view.
export const coturnMountpoint = '/mnt/coturn'
export const coturnSecretPath = `${coturnMountpoint}/turn-secret`

/**
 * Read a secret another package publishes on one of its volumes, through a
 * throwaway container that mounts only that subpath read-only, so a missing
 * dependency can never take Nextcloud's own daemons down. Null if unreadable.
 */
export async function readDependencySecret(
  effects: T.Effects,
  opts: {
    dependencyId: string
    volumeId: string
    subpath: string
    mountpoint: string
    path: string
  },
): Promise<string | null> {
  const reader = sdk.SubContainer.of(
    effects,
    { imageId: 'valkey' },
    sdk.Mounts.of().mountDependency({
      dependencyId: opts.dependencyId,
      volumeId: opts.volumeId,
      subpath: opts.subpath,
      mountpoint: opts.mountpoint,
      readonly: true,
    }),
    `${opts.dependencyId}-secret-read`,
  )
  try {
    const { stdout } = await reader.execFail(['cat', opts.path])
    return stdout.toString().trim() || null
  } catch {
    return null
  } finally {
    await reader.destroy().catch(() => {})
  }
}

export const nextcloudMount = sdk.Mounts.of().mountVolume({
  volumeId: 'nextcloud',
  mountpoint: NEXTCLOUD_PATH,
  readonly: false,
  subpath: null,
})

export const POSTGRES_DB = 'nextcloud'
export const POSTGRES_USER = 'nextcloud'
export const PGDATA = `${POSTGRES_PATH}/data`

export function getPostgresEnv() {
  return {
    POSTGRES_DB,
    POSTGRES_USER,
    PGDATA,
  }
}

export function getNextcloudEnv(postgresEnv: Record<string, string>) {
  return {
    ...postgresEnv,
    PHP_MEMORY_LIMIT: '1024M',
    PHP_UPLOAD_LIMIT: '20480M',
    POSTGRES_HOST: 'localhost',
    // keeps mod_remoteip off: REMOTE_ADDR must stay the proxy's bridge IP,
    // which is what config.php's trusted_proxies matches
    APACHE_DISABLE_REWRITE_IP: '1',
  }
}

export const locales = {
  en_US: 'English (US)',
  en_GB: 'English (GB)',
  zh: 'Chinese',
  es: 'Spanish',
  es_419: 'Spanish (LA)',
  hi: 'Hindi',
  pt: 'Portuguese',
  ru: 'Russian',
  ja: 'Japanese',
  de: 'German',
  fr: 'French',
  pl: 'Polish',
} as const

// `trashbin_retention_obligation` values. The first component is the minimum
// retention and the second the maximum; `auto` in either position means "as
// space is needed". Nextcloud's grammar also allows `D1, D2`, which guarantees
// a floor — not offered here, since a floor can hold files past the maximum a
// user picked to reclaim space.
export const trashRetention = {
  auto: 'Default (at least 30 days, then as space is needed)',
  'auto, 7': 'Delete after 7 days',
  'auto, 30': 'Delete after 30 days',
  'auto, 90': 'Delete after 90 days',
  'auto, 180': 'Delete after 180 days',
  'auto, 365': 'Delete after 365 days',
  disabled: 'Never delete automatically',
} as const

export const phoneRegions = {
  US: 'United States',
  GB: 'United Kingdom',
  CN: 'China',
  ES: 'Spain',
  MX: 'Mexico',
  IN: 'India',
  BR: 'Brazil',
  RU: 'Russia',
  JP: 'Japan',
  DE: 'Germany',
  FR: 'France',
  PL: 'Poland',
} as const

export function getValkeySub(effects: T.Effects) {
  return sdk.SubContainer.of(
    effects,
    { imageId: 'valkey' },
    sdk.Mounts.of(),
    'valkey',
  )
}

export function getNextcloudSub(effects: T.Effects) {
  return sdk.SubContainer.of(
    effects,
    { imageId: 'nextcloud' },
    nextcloudMount,
    'nextcloud-sub',
  )
}

export function getPostgresSub(effects: T.Effects) {
  return sdk.SubContainer.of(
    effects,
    { imageId: 'postgres' },
    sdk.Mounts.of().mountVolume({
      volumeId: 'db',
      mountpoint: POSTGRES_PATH,
      readonly: false,
      subpath: null,
    }),
    'postgres-sub',
  )
}

export function getBaseDaemons(
  effects: T.Effects,
  postgresSub: Awaited<ReturnType<typeof getPostgresSub>>,
  nextcloudSub: Awaited<ReturnType<typeof getNextcloudSub>>,
  valkeySub: Awaited<ReturnType<typeof getValkeySub>>,
  postgresEnv: Record<string, string>,
) {
  return sdk.Daemons.of(effects)
    .addOneshot('chown', {
      subcontainer: nextcloudSub,
      exec: {
        command: ['chown', '-R', 'www-data:www-data', NEXTCLOUD_PATH],
      },
      requires: [],
    })
    .addOneshot('pg-recover', {
      subcontainer: postgresSub,
      exec: {
        // An unclean stop strands postmaster.pid, and Postgres aborts if the
        // PID it names is alive — which, in a fresh PID namespace, is usually
        // an unrelated process. As root, so ownership can never block the
        // removal and wedge the chain on this oneshot.
        command: ['rm', '-f', `${PGDATA}/postmaster.pid`],
        user: 'root',
      },
      requires: [],
    })
    .addDaemon('postgres', {
      subcontainer: postgresSub,
      exec: {
        command: sdk.useEntrypoint(),
        env: postgresEnv,
      },
      ready: {
        display: null,
        fn: async () => {
          const { exitCode } = await postgresSub.exec([
            `pg_isready`,
            '-U',
            POSTGRES_USER,
            '-h',
            'localhost',
          ])

          if (exitCode !== 0) {
            return {
              result: 'loading',
              message: null,
            }
          }
          return {
            result: 'success',
            message: null,
          }
        },
      },
      requires: ['pg-recover'],
    })
    .addDaemon('valkey', {
      subcontainer: valkeySub,
      exec: { command: 'valkey-server' },
      ready: {
        display: null,
        fn: async () => {
          const res = await valkeySub.exec(['valkey-cli', 'ping'])
          return res.stdout.toString().trim() === 'PONG'
            ? { message: '', result: 'success' }
            : { message: res.stdout.toString().trim(), result: 'failure' }
        },
      },
      requires: [],
    })
}

export function getRandomPassword() {
  return utils.getDefaultString({
    charset: 'a-z,A-Z,0-9',
    len: 24,
  })
}
