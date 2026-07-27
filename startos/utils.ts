import { sdk } from './sdk'
import { T, utils } from '@start9labs/start-sdk'

export const uiPort = 80 as const
export const NEXTCLOUD_PATH = '/var/www/html' as const
export const POSTGRES_PATH = '/var/lib/postgresql' as const

export const NEXTCLOUD_VOLUME_HOST = '/media/startos/volumes/nextcloud' as const

/**
 * Throws `errorMessage` if a Nextcloud app's files are not present on the
 * volume. Checks both `custom_apps/` (user-installed) and `apps/` (built-in).
 * Used by actions that require a prerequisite Nextcloud app — calling this at
 * the top of the action's `run` produces a coherent error in the UI when the
 * app is missing.
 *
 * Note: this only checks file presence, not whether the app is enabled in
 * Nextcloud's database. An installed-but-disabled app passes this check;
 * running its `occ` namespace would then fail.
 */
export async function requireNextcloudApp(
  name: string,
  errorMessage: string,
): Promise<void> {
  const { stat } = await import('node:fs/promises')
  for (const dir of ['custom_apps', 'apps']) {
    const ok = await stat(`${NEXTCLOUD_VOLUME_HOST}/${dir}/${name}`).then(
      () => true,
      () => false,
    )
    if (ok) return
  }
  throw new Error(errorMessage)
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
