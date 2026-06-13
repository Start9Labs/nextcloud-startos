import { IMPOSSIBLE, T, VersionInfo, YAML } from '@start9labs/start-sdk'
import { readFile, rm, stat } from 'fs/promises'
import { cp } from 'node:fs/promises'
import { resetAdmin } from '../actions/maintenance/resetAdmin'
import { configPhp } from '../fileModels/config.php'
import { storeJson } from '../fileModels/store.json'
import { i18n } from '../i18n'
import { sdk } from '../sdk'
import { NEXTCLOUD_PATH, PGDATA, POSTGRES_PATH, nextcloudMount } from '../utils'

const POSTGRES_VOLUME_HOST = '/media/startos/volumes/db' as const

// True when 0.3.5x left config.yaml on the main volume but no postgres cluster
// was ever written — the user configured Nextcloud but never started it. In
// that state relocatePostgres fails on the missing source (the "mv 17/main"
// error) and migrateNextcloud fails on the empty app volume; there's nothing
// to migrate, so we surface a clear "uninstall and reinstall" message instead.
const isNeverStarted = async (): Promise<boolean> => {
  for (const p of [
    `${POSTGRES_VOLUME_HOST}/17/main`,
    `${POSTGRES_VOLUME_HOST}/15/main`,
    `${POSTGRES_VOLUME_HOST}/data`,
  ]) {
    if (
      await stat(p).then(
        () => true,
        () => false,
      )
    )
      return false
  }
  return true
}

const relocatePostgres = async (effects: T.Effects) => {
  const pgMounts = sdk.Mounts.of().mountVolume({
    volumeId: 'db',
    mountpoint: POSTGRES_PATH,
    readonly: false,
    subpath: null,
  })

  await sdk.SubContainer.withTemp(
    effects,
    { imageId: 'postgres' },
    pgMounts,
    'pg-migrate',
    async (sub) => {
      // Relocate PG data from 0.3.5x Debian path (17/main) to Docker path (data).
      // If a previous migration attempt succeeded here but failed later,
      // data/ already exists and 17/main is gone. Skip the move in that case.
      const { exitCode } = await sub.exec(['test', '-d', PGDATA])
      if (exitCode !== 0) {
        await sub.execFail(['mv', `${POSTGRES_PATH}/17/main`, PGDATA], {
          user: 'root',
        })
        await sub.execFail(['rm', '-rf', `${POSTGRES_PATH}/17`], {
          user: 'root',
        })
      }
      await sub.execFail(['chown', '-R', 'postgres:postgres', POSTGRES_PATH], {
        user: 'root',
      })
      await sub.exec(['rm', '-f', `${PGDATA}/postmaster.pid`], {
        user: 'postgres',
      })
    },
  )
}

type OldConfig = {
  'default-locale': string
  'default-phone-region': string
  maintenance_window_start: number
}

const migrateConfig = async (effects: T.Effects, config: OldConfig) => {
  await cp(configPhp.path, `${configPhp.path}.bak`)

  await configPhp.merge(effects, {
    default_locale: config['default-locale'],
    default_phone_region: config['default-phone-region'],
    maintenance_window_start: config.maintenance_window_start,
    'overwrite.cli.url': undefined,
    'htaccess.RewriteBase': undefined,
  })

  const adminPassword: string | undefined = (
    await readFile(
      '/media/startos/volumes/main/start9/password.dat',
      'utf-8',
    ).catch(() => undefined)
  )?.trim()
  if (adminPassword) {
    await storeJson.merge(effects, { adminPassword })
  } else {
    await sdk.action.createOwnTask(effects, resetAdmin, 'critical', {
      reason: i18n(
        'Admin password could not be recovered from migration. Please reset it.',
      ),
    })
  }
}

const migrateNextcloud = async (effects: T.Effects) => {
  await sdk.SubContainer.withTemp(
    effects,
    { imageId: 'nextcloud' },
    nextcloudMount,
    'upgrade-sub',
    async (sub) => {
      // Fix permissions on Nextcloud app files (everything except data/).
      // In 0.3.5.1, the upstream Docker entrypoint set group=root. In 0.4.0,
      // the group is www-data. We need ug+rw so the owner and group can
      // read/write, and o-rwx so other users (including dependent services
      // not in the www-data group) cannot access app internals.
      // The data/ directory is excluded here and handled separately below.
      await sub.execFail(
        [
          'find',
          NEXTCLOUD_PATH,
          '-path',
          `${NEXTCLOUD_PATH}/data`,
          '-prune',
          '-o',
          '-exec',
          'chmod',
          'ug+rw,o-rwx',
          '{}',
          '+',
        ],
        { user: 'root' },
      )
      // occ must be executable for Nextcloud CLI operations
      await sub.execFail(['chmod', 'u+x', `${NEXTCLOUD_PATH}/occ`], {
        user: 'root',
      })

      // Fix permissions on user data files (data/).
      //
      // The data directory can be enormous (2TB+), so we cannot use a single
      // recursive find or chmod -R — both accumulate inode metadata for the
      // entire tree in memory and get OOM-killed (SIGKILL) in the
      // memory-constrained migration subcontainer.
      //
      // Strategy: walk the directory tree from TypeScript, processing one
      // directory at a time. For each directory:
      //   1. find -maxdepth 1 -print0 | xargs -0 -n 5000 chmod ...
      //      Streams the immediate children through xargs in batches of 5000,
      //      so neither find nor chmod ever holds more than one directory's
      //      listing in memory.
      //   2. find -maxdepth 1 -mindepth 1 -type d -print0
      //      Lists only the immediate subdirectories so we can recurse into
      //      them one at a time. Uses -print0 / split('\0') to handle
      //      filenames with spaces or special characters.
      //
      // This keeps peak memory proportional to the largest single directory,
      // not the total file count.
      let dirCount = 0
      const chmodDir = async (dir: string) => {
        dirCount++
        if (dirCount % 100 === 0) {
          console.info(
            `chmod migration: processed ${dirCount} directories, current: ${dir}`,
          )
        }
        await sub.execFail(
          [
            'sh',
            '-c',
            `find "$1" -maxdepth 1 -print0 | xargs -0 -n 5000 chmod ug+rw,o-rwx`,
            '_',
            dir,
          ],
          { user: 'root' },
        )
        const { stdout } = await sub.execFail(
          [
            'find',
            dir,
            '-maxdepth',
            '1',
            '-mindepth',
            '1',
            '-type',
            'd',
            '-print0',
          ],
          { user: 'root' },
        )
        const subdirs = stdout
          .toString()
          .split('\0')
          .filter((s) => s.length > 0)
        for (const subdir of subdirs) {
          await chmodDir(subdir)
        }
      }
      await chmodDir(`${NEXTCLOUD_PATH}/data`)
    },
  )
}

export const current = VersionInfo.of({
  version: '33.0.5:1',
  releaseNotes: {
    en_US: `Updated Nextcloud to 33.0.5 (Hub 26 Winter), a major release.

- New \`/metrics\` OpenMetrics/Prometheus endpoint (localhost-only by default)
- Faster internal HTTP client (HTTP/2, brotli) and authoritative mount-provider APIs
- PostgreSQL 13 and PHP 8.1 are no longer supported upstream (the bundled image already ships a supported PHP, and this package ships PostgreSQL 17)
- An update interrupted partway (e.g. by a restart) now finishes automatically on the next start, and the web interface shows as "starting" rather than "failed" while an update runs

Full changelog: https://nextcloud.com/changelog/`,
    es_ES: `Se actualizó Nextcloud a 33.0.5 (Hub 26 Winter), una versión mayor.

- Nuevo endpoint \`/metrics\` OpenMetrics/Prometheus (solo localhost de forma predeterminada)
- Cliente HTTP interno más rápido (HTTP/2, brotli) y nuevas APIs de proveedores de montaje autoritativos
- PostgreSQL 13 y PHP 8.1 ya no son compatibles upstream (la imagen incluida ya trae un PHP compatible y este paquete usa PostgreSQL 17)
- Una actualización interrumpida a medias (por ejemplo, por un reinicio) ahora se completa automáticamente en el siguiente inicio, y la interfaz web aparece como «iniciando» en lugar de «fallida» mientras se ejecuta una actualización

Registro de cambios completo: https://nextcloud.com/changelog/`,
    de_DE: `Nextcloud auf 33.0.5 (Hub 26 Winter) aktualisiert, eine Hauptversion.

- Neuer \`/metrics\`-Endpunkt für OpenMetrics/Prometheus (standardmäßig nur localhost)
- Schnellerer interner HTTP-Client (HTTP/2, brotli) und neue APIs für autoritative Mount-Provider
- PostgreSQL 13 und PHP 8.1 werden upstream nicht mehr unterstützt (das mitgelieferte Image enthält bereits ein unterstütztes PHP, und dieses Paket nutzt PostgreSQL 17)
- Eine teilweise unterbrochene Aktualisierung (z. B. durch einen Neustart) wird jetzt beim nächsten Start automatisch abgeschlossen, und die Weboberfläche wird während einer Aktualisierung als „wird gestartet" statt als „fehlgeschlagen" angezeigt

Vollständige Änderungsliste: https://nextcloud.com/changelog/`,
    pl_PL: `Zaktualizowano Nextcloud do 33.0.5 (Hub 26 Winter), wydanie główne.

- Nowy punkt końcowy \`/metrics\` OpenMetrics/Prometheus (domyślnie tylko localhost)
- Szybszy wewnętrzny klient HTTP (HTTP/2, brotli) oraz nowe API dostawców montowania autorytatywnego
- PostgreSQL 13 i PHP 8.1 nie są już wspierane upstream (dołączony obraz zawiera już wspierane PHP, a ten pakiet używa PostgreSQL 17)
- Aktualizacja przerwana w trakcie (np. przez ponowne uruchomienie) jest teraz automatycznie kończona przy następnym uruchomieniu, a interfejs webowy podczas aktualizacji jest oznaczany jako „uruchamianie" zamiast „błąd"

Pełny dziennik zmian: https://nextcloud.com/changelog/`,
    fr_FR: `Mise à jour de Nextcloud vers 33.0.5 (Hub 26 Winter), une version majeure.

- Nouveau point de terminaison \`/metrics\` OpenMetrics/Prometheus (localhost uniquement par défaut)
- Client HTTP interne plus rapide (HTTP/2, brotli) et nouvelles API de fournisseurs de montage autoritatifs
- PostgreSQL 13 et PHP 8.1 ne sont plus pris en charge en amont (l'image fournie embarque déjà un PHP pris en charge et ce paquet utilise PostgreSQL 17)
- Une mise à jour interrompue en cours de route (par exemple par un redémarrage) se termine maintenant automatiquement au prochain démarrage, et l'interface web est indiquée comme « démarrage » plutôt que « échec » pendant une mise à jour

Journal des modifications complet : https://nextcloud.com/changelog/`,
  },
  migrations: {
    up: async ({ effects }) => {
      const start9Path = '/media/startos/volumes/main/start9'

      // Only run 0.3.5x → 0.4.0 migration if config.yaml exists (0.3.5x marker)
      const configYaml: OldConfig | undefined = await readFile(
        `${start9Path}/config.yaml`,
        'utf-8',
      ).then(YAML.parse, () => undefined)

      if (configYaml) {
        if (await isNeverStarted()) {
          throw new Error(
            'This Nextcloud package was configured on StartOS 0.3.5x but never started, so there is no data to migrate to 0.4.0. Please uninstall the Nextcloud package and reinstall it to set up a fresh 0.4.0 install.',
          )
        }
        await relocatePostgres(effects)
        await migrateConfig(effects, configYaml)
        await migrateNextcloud(effects)
        await rm(start9Path, { recursive: true })
        // Remove stale config.php keys from 0.3.5.1
        await configPhp.merge(effects, {
          'overwrite.cli.url': undefined,
          'htaccess.RewriteBase': undefined,
        })
      }

      // Previous 0.4.0 beta: relocate PGDATA (17/docker → data)
      const OLD_PGDATA_HOST = '/media/startos/volumes/db/17/docker'
      const oldPgdataExists = await stat(OLD_PGDATA_HOST).then(
        () => true,
        () => false,
      )
      if (oldPgdataExists) {
        const pgMounts = sdk.Mounts.of().mountVolume({
          volumeId: 'db',
          subpath: null,
          mountpoint: POSTGRES_PATH,
          readonly: false,
        })
        await sdk.SubContainer.withTemp(
          effects,
          { imageId: 'postgres' },
          pgMounts,
          'pg-relocate',
          async (sub) => {
            await sub.execFail(['mv', `${POSTGRES_PATH}/17/docker`, PGDATA], {
              user: 'root',
            })
            await sub.execFail(['rm', '-rf', `${POSTGRES_PATH}/17`], {
              user: 'root',
            })
          },
        )
      }
    },
    down: IMPOSSIBLE,
  },
})
