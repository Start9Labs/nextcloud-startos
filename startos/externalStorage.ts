import { I18nKey } from './i18n/dictionaries/default'

/**
 * Registry of services whose storage can be surfaced inside Nextcloud's Files
 * app via Nextcloud's built-in External Storage app (`files_external`).
 *
 * The `external-storage` action lists only the sources whose backing service is
 * actually installed (via `effects.getInstalledPackages()`), so uninstalled
 * services never clutter the form. Each selected source's volume is mounted into
 * Nextcloud's container (see main.ts) and a `files_external` entry is created
 * for it.
 *
 * Adding a new source is a few mechanical edits, all keyed off this registry:
 *   1. add its id to EXTERNAL_STORAGE_SOURCES + an entry in externalStorageMeta
 *      (its `packageId`, display `label`, mountpoint, Files folder, version)
 *   2. add it to the `z.enum([...])` in fileModels/store.json.ts
 *   3. add a typed `mountDependency` block in main.ts (the one part that needs
 *      the source package's manifest type) + a dependency in dependencies.ts
 *      and the manifest, and its `label` to the i18n dictionaries
 * The action then surfaces it automatically — but only when it's installed.
 *
 * Good candidates expose real, browsable files on their OWN volume (a
 * downloads/media/documents directory) — e.g. qBittorrent (`main`/`downloads`).
 * AVOID app-managed content-addressed stores that intermingle a database with
 * hash-named blobs (e.g. Docuseal): surfacing those exposes the DB and shows
 * unbrowsable files. NextExplorer is the intended shared hub other services
 * route through, so a direct source is only worth adding for a service whose
 * files live in its own volume.
 */

export const EXTERNAL_STORAGE_SOURCES = ['nextexplorer', 'filebrowser'] as const
export type ExternalStorageSource = (typeof EXTERNAL_STORAGE_SOURCES)[number]

export type ExternalStorageMeta = {
  /** StartOS package id of the backing service (for the installed-check + dep). */
  packageId: string
  /** i18n key for the source's display name in the action. */
  label: I18nKey
  /** Where the source's volume is mounted inside Nextcloud's container. */
  mountpoint: string
  /** The directory under `mountpoint` the `files_external` entry exposes. */
  dataDir: string
  /**
   * The mount point (folder name) of the `files_external` entry as shown in
   * the Nextcloud Files UI. Also used to find the entry again for deletion.
   */
  ncMountPoint: string
  /**
   * Set for a source whose volume root is a list of drives rather than one
   * tree. Every top-level directory then gets a `files_external` entry of its
   * own — the one at `dataDir` under `ncMountPoint`, the others under
   * `ncMountPoint (<drive>)` — except the names listed here, which must never
   * be surfaced. Only drives that exist get one: `dataDir` included.
   */
  drives?: { exclude: readonly string[] }
  /**
   * Version range the source's StartOS package must satisfy. Floor it at the
   * release whose on-disk layout this integration mounts (volume id, file
   * ownership), and cap it below the next incompatible major.
   */
  versionRange: string
}

export const externalStorageMeta: Record<
  ExternalStorageSource,
  ExternalStorageMeta
> = {
  nextexplorer: {
    packageId: 'nextexplorer',
    label: 'NextExplorer',
    mountpoint: '/mnt/nextexplorer',
    // The drive that takes the bare folder name. Never the volume root: it
    // also holds `_users`, one private directory per NextExplorer account,
    // which a mount would expose.
    dataDir: '/mnt/nextexplorer/Files',
    ncMountPoint: '/NextExplorer',
    // NextExplorer shows every top-level directory as a drive, and they are
    // not all `Files`: its File Browser import lands in `FileBrowser`, and a
    // service can be pointed at a drive of its own. Nor is `Files` always
    // there — NextExplorer makes it when it first starts, and the dependency
    // only asks that it be installed. `_users` is the one name NextExplorer
    // itself keeps out of that list.
    drives: { exclude: ['_users'] },
    // 2.2.7:0, the first published release, has this layout (`data` volume at
    // the drive root, `Files` drive, files owned by uid 1000), and 3.x keeps
    // it. Capped below 4 rather than a caret, which would exclude 3.x.
    versionRange: '>=2.2.7:0 && <4.0.0:0',
  },
  filebrowser: {
    packageId: 'filebrowser',
    label: 'FileBrowser Quantum',
    mountpoint: '/mnt/filebrowser',
    dataDir: '/mnt/filebrowser',
    ncMountPoint: '/FileBrowser',
    // 2.62.2:1 restructured the volumes (`data` volume, files owned by uid
    // 1000) — everything the idmap mount in main.ts relies on.
    versionRange: '^2.62.2:1',
  },
}

/** The directory a drive's `files_external` entry points at. */
export const driveDataDir = (meta: ExternalStorageMeta, drive: string) =>
  `${meta.mountpoint}/${drive}`

/** The folder a drive appears as in Nextcloud Files. */
export const driveMountPoint = (meta: ExternalStorageMeta, drive: string) =>
  driveDataDir(meta, drive) === meta.dataDir
    ? meta.ncMountPoint
    : `${meta.ncMountPoint} (${drive})`

/**
 * Whether a top-level directory of a source's volume is one of its drives.
 * Mirrors NextExplorer's own drive list: nothing hidden, nothing in `exclude`.
 */
function isDrive(meta: ExternalStorageMeta, name: string): boolean {
  if (!meta.drives) return false
  const exclude: readonly string[] = meta.drives.exclude
  return (
    name !== '' &&
    !name.includes('/') &&
    !name.startsWith('.') &&
    !exclude.includes(name)
  )
}

/**
 * The drives of a source to surface, given the names of the directories at the
 * top of its volume. Sorted, so the result can go straight into the reconcile
 * signature.
 */
export function drivesOf(
  meta: ExternalStorageMeta,
  topLevelDirs: string[],
): string[] {
  return [...new Set(topLevelDirs)].filter((name) => isDrive(meta, name)).sort()
}

/** The fields of a `files_external:list` row that identify a drive's entry. */
export type ExternalMountRow = {
  storage?: string
  configuration?: { datadir?: string }
}

export const LOCAL_STORAGE = '\\OC\\Files\\Storage\\Local'

/** The directory a `files_external` entry points at, without a trailing slash. */
export const mountDataDir = (m: ExternalMountRow) =>
  String(m.configuration?.datadir ?? '').replace(/\/+$/, '')

/**
 * The drive a `files_external` entry surfaces, or null when it is not one of
 * this source's drives — so an entry someone pointed at an excluded or
 * hidden directory by hand is never taken for ours. An entry is recognized by
 * the directory it points at rather than by its folder name, so one an admin
 * renamed in Nextcloud's settings is still found — kept while the drive
 * exists, removed once it is gone — instead of being duplicated under the
 * default name.
 */
export function driveOf(
  meta: ExternalStorageMeta,
  m: ExternalMountRow,
): string | null {
  if (m.storage !== LOCAL_STORAGE) return null
  const dir = mountDataDir(m)
  const prefix = `${meta.mountpoint}/`
  if (!dir.startsWith(prefix)) return null
  const name = dir.slice(prefix.length)
  return isDrive(meta, name) ? name : null
}
