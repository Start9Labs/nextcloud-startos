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
  version: '34.0.0:0',
  releaseNotes: {
    en_US: `Updates Nextcloud to 34.0.0 (Hub 26 Spring), a major release.

**Highlights**

- Euro-Office joins the Nextcloud Office suite, with local processing for faster, more responsive editing.
- Lighter, refined interface with a new waffle app launcher.
- Assistant gains document sidebar chat and a context agent that searches across files, emails, tasks, Deck, and Forms.
- Calendar read/write federation between instances and improved delegation.
- New file type support (.HIF, .TOML, .OVPN) and file creation-time tracking.
- Security: one-time login QR codes enabled by default.

**Heads-up**

- jQuery and jQuery UI are removed; some unmaintained third-party apps may need an update.
- Requires PHP 8.2+, shipped with this package, so no action is needed.

Full changelog: https://nextcloud.com/changelog/`,
    es_ES: `Actualiza Nextcloud a 34.0.0 (Hub 26 Spring), una versión principal.

**Novedades**

- Euro-Office se suma a la suite Nextcloud Office, con procesamiento local para una edición más rápida y fluida.
- Interfaz más ligera y refinada con un nuevo lanzador de aplicaciones tipo waffle.
- El Asistente incorpora chat en la barra lateral de documentos y un agente de contexto que busca en archivos, correos, tareas, Deck y Forms.
- Federación de calendario en lectura/escritura entre instancias y mejor delegación.
- Compatibilidad con nuevos tipos de archivo (.HIF, .TOML, .OVPN) y registro de la hora de creación.
- Seguridad: códigos QR de inicio de sesión de un solo uso activados de forma predeterminada.

**Aviso**

- Se eliminan jQuery y jQuery UI; algunas apps de terceros sin mantenimiento podrían necesitar actualización.
- Requiere PHP 8.2+, incluido en este paquete, así que no hay que hacer nada.

Registro de cambios completo: https://nextcloud.com/changelog/`,
    de_DE: `Aktualisiert Nextcloud auf 34.0.0 (Hub 26 Spring), eine Hauptversion.

**Highlights**

- Euro-Office wird Teil der Nextcloud-Office-Suite, mit lokaler Verarbeitung für schnelleres, reaktionsfreudigeres Bearbeiten.
- Leichtere, überarbeitete Oberfläche mit neuem Waffle-App-Starter.
- Der Assistent erhält Dokument-Seitenleisten-Chat und einen Kontext-Agenten, der Dateien, E-Mails, Aufgaben, Deck und Forms durchsucht.
- Kalender-Föderation mit Lese-/Schreibzugriff zwischen Instanzen und verbesserte Delegation.
- Unterstützung neuer Dateitypen (.HIF, .TOML, .OVPN) und Erfassung der Erstellungszeit.
- Sicherheit: Einmal-Login-QR-Codes standardmäßig aktiviert.

**Hinweis**

- jQuery und jQuery UI werden entfernt; manche ungepflegten Drittanbieter-Apps brauchen evtl. ein Update.
- Erfordert PHP 8.2+, in diesem Paket enthalten, daher ist nichts zu tun.

Vollständiges Änderungsprotokoll: https://nextcloud.com/changelog/`,
    pl_PL: `Aktualizuje Nextcloud do 34.0.0 (Hub 26 Spring), wydanie główne.

**Najważniejsze**

- Euro-Office dołącza do pakietu Nextcloud Office, z lokalnym przetwarzaniem dla szybszej i płynniejszej edycji.
- Lżejszy, dopracowany interfejs z nowym launcherem aplikacji typu waffle.
- Asystent zyskuje czat w panelu bocznym dokumentu oraz agenta kontekstowego przeszukującego pliki, e-maile, zadania, Deck i Forms.
- Federacja kalendarza z odczytem/zapisem między instancjami oraz lepsza delegacja.
- Obsługa nowych typów plików (.HIF, .TOML, .OVPN) i rejestrowanie czasu utworzenia.
- Bezpieczeństwo: jednorazowe kody QR logowania włączone domyślnie.

**Uwaga**

- Usunięto jQuery i jQuery UI; niektóre nieutrzymywane aplikacje zewnętrzne mogą wymagać aktualizacji.
- Wymaga PHP 8.2+, dostarczanego z tym pakietem, więc nie trzeba nic robić.

Pełny dziennik zmian: https://nextcloud.com/changelog/`,
    fr_FR: `Met à jour Nextcloud vers 34.0.0 (Hub 26 Spring), une version majeure.

**Nouveautés**

- Euro-Office rejoint la suite Nextcloud Office, avec un traitement local pour une édition plus rapide et réactive.
- Interface plus légère et raffinée avec un nouveau lanceur d'applications en gaufre.
- L'Assistant gagne un chat dans la barre latérale des documents et un agent de contexte qui cherche dans les fichiers, e-mails, tâches, Deck et Forms.
- Fédération de calendrier en lecture/écriture entre instances et délégation améliorée.
- Prise en charge de nouveaux types de fichiers (.HIF, .TOML, .OVPN) et suivi de l'heure de création.
- Sécurité : codes QR de connexion à usage unique activés par défaut.

**À noter**

- jQuery et jQuery UI sont supprimés ; certaines applications tierces non maintenues peuvent nécessiter une mise à jour.
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
