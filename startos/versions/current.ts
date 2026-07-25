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
  version: '33.0.6:2',
  releaseNotes: {
    en_US: `Adds File Browser External Storage integration and repackages Nextcloud on start-sdk 2.0 (bundled image updated to Nextcloud 33.0.6 — upstream security and bug fixes).

**External Storage**

- New action to surface File Browser's shared storage as a folder in your Files, scoped per Nextcloud user — so you can move files into Nextcloud.

**Upgrades**

- Nextcloud version upgrades now run during the update step, so a failed upgrade rolls back cleanly instead of leaving the app in need of manual recovery.

**Fixes**

- Fixed a bug where background network changes on the server could put Nextcloud into a restart loop.

Internal updates (start-sdk 2.0).

Full changelog: https://github.com/nextcloud-releases/server/releases/tag/v33.0.6`,
    es_ES: `Añade la integración de Almacenamiento externo de File Browser y reempaqueta Nextcloud sobre start-sdk 2.0 (imagen incluida actualizada a Nextcloud 33.0.6 — correcciones de seguridad y de errores upstream).

**Almacenamiento externo**

- Nueva acción para mostrar el almacenamiento compartido de File Browser como una carpeta en tus Archivos, por usuario de Nextcloud, para que puedas mover archivos a Nextcloud.

**Actualizaciones de versión**

- Las actualizaciones de versión de Nextcloud ahora se ejecutan durante el paso de actualización, de modo que una actualización fallida se revierte limpiamente en lugar de dejar la aplicación en un estado que requiere recuperación manual.

**Correcciones**

- Corregido un error por el que cambios de red en segundo plano en el servidor podían poner Nextcloud en un bucle de reinicios.

Actualizaciones internas (start-sdk 2.0).

Registro de cambios completo: https://github.com/nextcloud-releases/server/releases/tag/v33.0.6`,
    de_DE: `Fügt die File-Browser-Integration „Externer Speicher" hinzu und stellt Nextcloud auf start-sdk 2.0 um (mitgeliefertes Image auf Nextcloud 33.0.6 aktualisiert — Sicherheits- und Fehlerkorrekturen im Upstream).

**Externer Speicher**

- Neue Aktion, um den gemeinsamen Speicher von File Browser als Ordner in Dateien anzuzeigen — pro Nextcloud-Benutzer, sodass Sie Dateien nach Nextcloud verschieben können.

**Versions-Upgrades**

- Nextcloud-Versions-Upgrades laufen jetzt während des Update-Schritts, sodass ein fehlgeschlagenes Upgrade sauber zurückgerollt wird, statt die App in einem Zustand zu hinterlassen, der manuelle Wiederherstellung erfordert.

**Fehlerkorrekturen**

- Ein Fehler wurde behoben, durch den Netzwerkänderungen im Hintergrund auf dem Server Nextcloud in eine Neustart-Schleife versetzen konnten.

Interne Aktualisierungen (start-sdk 2.0).

Vollständige Änderungsliste: https://github.com/nextcloud-releases/server/releases/tag/v33.0.6`,
    pl_PL: `Dodaje integrację Magazynu zewnętrznego z File Browser i przenosi Nextcloud na start-sdk 2.0 (dołączony obraz zaktualizowany do Nextcloud 33.0.6 — poprawki bezpieczeństwa i błędów w upstreamie).

**Magazyn zewnętrzny**

- Nowa akcja udostępniająca współdzieloną przestrzeń File Browser jako folder w aplikacji Pliki, per użytkownik Nextcloud, dzięki czemu możesz przenosić pliki do Nextcloud.

**Aktualizacje wersji**

- Aktualizacje wersji Nextcloud są teraz wykonywane podczas kroku aktualizacji, dzięki czemu nieudana aktualizacja jest czysto wycofywana, zamiast pozostawiać aplikację w stanie wymagającym ręcznego przywracania.

**Poprawki**

- Naprawiono błąd, przez który zmiany sieci w tle na serwerze mogły wprowadzić Nextcloud w pętlę restartów.

Aktualizacje wewnętrzne (start-sdk 2.0).

Pełny dziennik zmian: https://github.com/nextcloud-releases/server/releases/tag/v33.0.6`,
    fr_FR: `Ajoute l'intégration Stockage externe de File Browser et repackage Nextcloud sur start-sdk 2.0 (image fournie mise à jour vers Nextcloud 33.0.6 — correctifs de sécurité et de bogues en amont).

**Stockage externe**

- Nouvelle action pour afficher le stockage partagé de File Browser comme un dossier dans Fichiers, par utilisateur Nextcloud, afin de pouvoir déplacer des fichiers vers Nextcloud.

**Mises à niveau de version**

- Les mises à niveau de version de Nextcloud s'exécutent désormais pendant l'étape de mise à jour, de sorte qu'une mise à niveau échouée est annulée proprement au lieu de laisser l'application dans un état nécessitant une récupération manuelle.

**Correctifs**

- Correction d'un bogue où des changements réseau en arrière-plan sur le serveur pouvaient placer Nextcloud dans une boucle de redémarrages.

Mises à jour internes (start-sdk 2.0).

Journal des modifications complet : https://github.com/nextcloud-releases/server/releases/tag/v33.0.6`,
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
