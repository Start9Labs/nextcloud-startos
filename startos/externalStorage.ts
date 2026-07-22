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
 * unbrowsable files. File Browser is the intended shared hub other services
 * route through, so a direct source is only worth adding for a service whose
 * files live in its own volume.
 */

export const EXTERNAL_STORAGE_SOURCES = ['filebrowser'] as const
export type ExternalStorageSource = (typeof EXTERNAL_STORAGE_SOURCES)[number]

export type ExternalStorageMeta = {
  /** StartOS package id of the backing service (for the installed-check + dep). */
  packageId: string
  /** i18n key for the source's display name in the action. */
  label: I18nKey
  /** Where the source's volume is mounted inside Nextcloud's container. */
  mountpoint: string
  /**
   * The mount point (folder name) of the `files_external` entry as shown in
   * the Nextcloud Files UI. Also used to find the entry again for deletion.
   */
  ncMountPoint: string
  /**
   * Version range the source's StartOS package must satisfy. Floor it at the
   * release whose on-disk layout this integration mounts (volume id, file
   * ownership), with a caret so a future major restructure isn't silently
   * claimed compatible.
   */
  versionRange: string
}

export const externalStorageMeta: Record<
  ExternalStorageSource,
  ExternalStorageMeta
> = {
  filebrowser: {
    packageId: 'filebrowser',
    label: 'File Browser',
    mountpoint: '/mnt/filebrowser',
    ncMountPoint: '/FileBrowser',
    // 2.62.2:1 restructured the volumes (`data` volume, files owned by uid
    // 1000) — everything the idmap mount in main.ts relies on.
    versionRange: '^2.62.2:1',
  },
}
