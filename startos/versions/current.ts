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
  version: '33.0.5:0',
  releaseNotes: {
    en_US: `Updates Nextcloud to 33.0.5 (Hub 26 Winter), a major release.

**Highlights**

- Markdown support in comments and federated folder shares.
- Rewritten LDAP setup wizard with local caching and expanded admin delegation.
- Faster previews for large remote files plus on-demand preview migration.
- Security: more flexible rate limiting and improved two-factor defaults.

**Heads-up**

- Drops Oracle 11 support and cleans up deprecated APIs and legacy JavaScript; some unmaintained third-party apps may need an update.
- Requires PHP 8.2+, shipped with this package, so no action is needed.

Full changelog: https://nextcloud.com/changelog/`,
    es_ES: `Actualiza Nextcloud a 33.0.5 (Hub 26 Winter), una versión principal.

**Novedades**

- Compatibilidad con Markdown en comentarios y recursos compartidos de carpetas federadas.
- Asistente de configuración LDAP reescrito con caché local y mayor delegación de administración.
- Vistas previas más rápidas para archivos remotos grandes y migración de vistas previas bajo demanda.
- Seguridad: limitación de tasa más flexible y mejores valores predeterminados de doble factor.

**Aviso**

- Se elimina la compatibilidad con Oracle 11 y se depuran APIs obsoletas y JavaScript heredado; algunas apps de terceros sin mantenimiento podrían necesitar actualización.
- Requiere PHP 8.2+, incluido en este paquete, así que no hay que hacer nada.

Registro de cambios completo: https://nextcloud.com/changelog/`,
    de_DE: `Aktualisiert Nextcloud auf 33.0.5 (Hub 26 Winter), eine Hauptversion.

**Highlights**

- Markdown-Unterstützung in Kommentaren und föderierte Ordnerfreigaben.
- Neu geschriebener LDAP-Einrichtungsassistent mit lokalem Caching und erweiterter Admin-Delegation.
- Schnellere Vorschauen für große entfernte Dateien sowie Migration auf Abruf.
- Sicherheit: flexiblere Ratenbegrenzung und verbesserte Zwei-Faktor-Standardwerte.

**Hinweis**

- Oracle-11-Unterstützung entfällt; veraltete APIs und Alt-JavaScript werden bereinigt; manche ungepflegten Drittanbieter-Apps brauchen evtl. ein Update.
- Erfordert PHP 8.2+, in diesem Paket enthalten, daher ist nichts zu tun.

Vollständiges Änderungsprotokoll: https://nextcloud.com/changelog/`,
    pl_PL: `Aktualizuje Nextcloud do 33.0.5 (Hub 26 Winter), wydanie główne.

**Najważniejsze**

- Obsługa Markdown w komentarzach oraz federacyjne udostępnianie folderów.
- Przepisany kreator konfiguracji LDAP z lokalnym buforowaniem i szerszą delegacją administracji.
- Szybsze podglądy dużych plików zdalnych oraz migracja podglądów na żądanie.
- Bezpieczeństwo: elastyczniejsze ograniczanie liczby żądań i lepsze domyślne ustawienia dwuskładnikowe.

**Uwaga**

- Usunięto obsługę Oracle 11 oraz uporządkowano przestarzałe API i stary JavaScript; niektóre nieutrzymywane aplikacje zewnętrzne mogą wymagać aktualizacji.
- Wymaga PHP 8.2+, dostarczanego z tym pakietem, więc nie trzeba nic robić.

Pełny dziennik zmian: https://nextcloud.com/changelog/`,
    fr_FR: `Met à jour Nextcloud vers 33.0.5 (Hub 26 Winter), une version majeure.

**Nouveautés**

- Prise en charge du Markdown dans les commentaires et partages de dossiers fédérés.
- Assistant de configuration LDAP réécrit avec cache local et délégation d'administration étendue.
- Aperçus plus rapides pour les gros fichiers distants et migration des aperçus à la demande.
- Sécurité : limitation de débit plus flexible et meilleurs réglages par défaut du double facteur.

**À noter**

- Suppression de la prise en charge d'Oracle 11 et nettoyage des API obsolètes et du JavaScript hérité ; certaines applications tierces non maintenues peuvent nécessiter une mise à jour.
- Nécessite PHP 8.2+, fourni avec ce paquet, aucune action requise.

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
