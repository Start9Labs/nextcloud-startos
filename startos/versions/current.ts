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
  version: '34.0.2:0',
  releaseNotes: {
    en_US: `Updated Nextcloud to 34.0.2 — the Nextcloud 34 major release, together with its 34.0.1 and 34.0.2 maintenance updates.

**Highlights**

- Rebuilt App Store, with an update-all button and faster browsing.
- Refreshed Files view: filters moved into the top bar, plus many drag-and-drop fixes.
- Better federation: read and write support for external CalDAV/CardDAV, contact filtering by team, and federated user and group search when adding team members.
- Security: one-time QR codes are on by default, and a setup check now warns when no second-factor provider is configured.
- Storage hygiene: optional automatic expiry of old previews, and automatic cleanup of background job history after 60 days.
- A lighter, faster interface — jQuery has been removed entirely.

**Before you update**

- Nextcloud can only be updated one major version at a time. If this package is still on a 32.x release, update it to a 33.x release first — the update is checked up front and refused rather than leaving the instance in a broken state.
- Nextcloud 34 removes several long-deprecated APIs, so some third-party apps may need an update of their own.

**Known issue**

- Upstream has temporarily disabled ImageMagick-based previews, so thumbnails for HEIC and some other formats are unavailable.

Full changelog: https://github.com/nextcloud-releases/server/releases/tag/v34.0.2`,
    es_ES: `Nextcloud actualizado a 34.0.2 — la versión principal Nextcloud 34, junto con sus actualizaciones de mantenimiento 34.0.1 y 34.0.2.

**Novedades destacadas**

- Tienda de aplicaciones rediseñada, con un botón para actualizar todo y navegación más rápida.
- Vista de Archivos renovada: los filtros se han movido a la barra superior, además de numerosas correcciones de arrastrar y soltar.
- Mejor federación: soporte de lectura y escritura para CalDAV/CardDAV externos, filtrado de contactos por equipo y búsqueda federada de usuarios y grupos al añadir miembros a un equipo.
- Seguridad: los códigos QR de un solo uso están activados de forma predeterminada y una comprobación de configuración avisa cuando no hay ningún proveedor de segundo factor configurado.
- Higiene del almacenamiento: caducidad automática opcional de vistas previas antiguas y limpieza automática del historial de trabajos en segundo plano tras 60 días.
- Una interfaz más ligera y rápida: jQuery se ha eliminado por completo.

**Antes de actualizar**

- Nextcloud solo puede actualizarse una versión principal a la vez. Si este paquete todavía está en una versión 32.x, actualícelo primero a una versión 33.x — la actualización se comprueba de antemano y se rechaza en lugar de dejar la instancia en un estado defectuoso.
- Nextcloud 34 elimina varias API obsoletas desde hace tiempo, por lo que algunas aplicaciones de terceros pueden necesitar su propia actualización.

**Problema conocido**

- Upstream ha deshabilitado temporalmente las vistas previas basadas en ImageMagick, por lo que las miniaturas de HEIC y de algunos otros formatos no están disponibles.

Registro de cambios completo: https://github.com/nextcloud-releases/server/releases/tag/v34.0.2`,
    de_DE: `Nextcloud auf 34.0.2 aktualisiert — die Hauptversion Nextcloud 34 zusammen mit ihren Wartungsversionen 34.0.1 und 34.0.2.

**Höhepunkte**

- Neu gebauter App Store, mit einer Schaltfläche „Alle aktualisieren“ und schnellerer Navigation.
- Überarbeitete Dateiansicht: Filter sind in die obere Leiste gewandert, dazu viele Korrekturen bei Drag-and-drop.
- Bessere Föderation: Lese- und Schreibzugriff auf externe CalDAV/CardDAV-Quellen, Kontaktfilterung nach Team und föderierte Benutzer- und Gruppensuche beim Hinzufügen von Teammitgliedern.
- Sicherheit: Einmal-QR-Codes sind standardmäßig aktiv, und eine Systemprüfung warnt, wenn kein Zweitfaktor-Anbieter eingerichtet ist.
- Speicherhygiene: optionaler automatischer Ablauf alter Vorschaubilder und automatische Bereinigung des Verlaufs der Hintergrundaufgaben nach 60 Tagen.
- Eine leichtere, schnellere Oberfläche — jQuery wurde vollständig entfernt.

**Vor der Aktualisierung**

- Nextcloud lässt sich nur eine Hauptversion auf einmal aktualisieren. Wenn dieses Paket noch auf einer 32.x-Version läuft, aktualisieren Sie es zuerst auf eine 33.x-Version — die Aktualisierung wird vorab geprüft und abgelehnt, statt die Instanz in einem defekten Zustand zurückzulassen.
- Nextcloud 34 entfernt mehrere seit Langem veraltete APIs, daher benötigen manche Apps von Drittanbietern eine eigene Aktualisierung.

**Bekanntes Problem**

- Upstream hat ImageMagick-basierte Vorschauen vorübergehend deaktiviert, daher sind Miniaturansichten für HEIC und einige andere Formate nicht verfügbar.

Vollständige Änderungsliste: https://github.com/nextcloud-releases/server/releases/tag/v34.0.2`,
    pl_PL: `Zaktualizowano Nextcloud do 34.0.2 — główne wydanie Nextcloud 34 wraz z wydaniami konserwacyjnymi 34.0.1 i 34.0.2.

**Najważniejsze zmiany**

- Przebudowany sklep z aplikacjami, z przyciskiem aktualizacji wszystkich aplikacji i szybszym przeglądaniem.
- Odświeżony widok Plików: filtry przeniesiono na górny pasek, wraz z wieloma poprawkami przeciągania i upuszczania.
- Lepsza federacja: odczyt i zapis dla zewnętrznych źródeł CalDAV/CardDAV, filtrowanie kontaktów według zespołu oraz federacyjne wyszukiwanie użytkowników i grup przy dodawaniu członków zespołu.
- Bezpieczeństwo: jednorazowe kody QR są domyślnie włączone, a kontrola konfiguracji ostrzega, gdy nie skonfigurowano dostawcy drugiego składnika.
- Porządek w magazynie: opcjonalne automatyczne wygasanie starych podglądów i automatyczne czyszczenie historii zadań w tle po 60 dniach.
- Lżejszy i szybszy interfejs — jQuery zostało całkowicie usunięte.

**Przed aktualizacją**

- Nextcloud można aktualizować tylko o jedną wersję główną naraz. Jeśli ten pakiet jest nadal w wersji 32.x, zaktualizuj go najpierw do wersji 33.x — aktualizacja jest sprawdzana z góry i odrzucana, zamiast pozostawiać instancję w uszkodzonym stanie.
- Nextcloud 34 usuwa kilka dawno przestarzałych interfejsów API, więc niektóre aplikacje innych firm mogą wymagać własnej aktualizacji.

**Znany problem**

- Upstream tymczasowo wyłączył podglądy oparte na ImageMagick, więc miniatury dla HEIC i niektórych innych formatów są niedostępne.

Pełny dziennik zmian: https://github.com/nextcloud-releases/server/releases/tag/v34.0.2`,
    fr_FR: `Nextcloud mis à jour vers 34.0.2 — la version majeure Nextcloud 34, accompagnée de ses versions de maintenance 34.0.1 et 34.0.2.

**Points forts**

- Boutique d'applications reconstruite, avec un bouton « tout mettre à jour » et une navigation plus rapide.
- Vue Fichiers rafraîchie : les filtres sont passés dans la barre supérieure, avec de nombreux correctifs du glisser-déposer.
- Meilleure fédération : prise en charge en lecture et en écriture des sources CalDAV/CardDAV externes, filtrage des contacts par équipe et recherche fédérée d'utilisateurs et de groupes lors de l'ajout de membres d'équipe.
- Sécurité : les codes QR à usage unique sont activés par défaut et une vérification de configuration avertit lorsqu'aucun fournisseur de second facteur n'est configuré.
- Hygiène du stockage : expiration automatique facultative des anciens aperçus et nettoyage automatique de l'historique des tâches de fond après 60 jours.
- Une interface plus légère et plus rapide — jQuery a été entièrement supprimé.

**Avant de mettre à jour**

- Nextcloud ne peut être mis à jour que d'une version majeure à la fois. Si ce paquet est encore sur une version 32.x, mettez-le d'abord à jour vers une version 33.x — la mise à jour est vérifiée en amont et refusée plutôt que de laisser l'instance dans un état défectueux.
- Nextcloud 34 supprime plusieurs API obsolètes de longue date : certaines applications tierces peuvent nécessiter leur propre mise à jour.

**Problème connu**

- En amont, les aperçus basés sur ImageMagick ont été temporairement désactivés : les miniatures pour HEIC et certains autres formats sont indisponibles.

Journal des modifications complet : https://github.com/nextcloud-releases/server/releases/tag/v34.0.2`,
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
