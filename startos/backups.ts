import { sdk } from './sdk'
import { POSTGRES_DB, POSTGRES_PATH, POSTGRES_USER } from './utils'
import { configPhp } from './fileModels/config.php'

export const { createBackup, restoreInit } = sdk.setupBackups(
  async () =>
    sdk.Backups.withPgDump({
      imageId: 'postgres',
      dbVolume: 'db',
      mountpoint: POSTGRES_PATH,
      pgdataPath: '/data',
      database: POSTGRES_DB,
      user: POSTGRES_USER,
      password: async () => {
        const config = await configPhp.read().once()
        if (!config?.dbpassword)
          throw new Error('No dbpassword found in config.php')
        return config.dbpassword
      },
    })
      // Backup scope: the Postgres dump above, the `main` volume (store.json,
      // admin password), and three subpaths of the `nextcloud` volume below
      // (user files, config, installed apps).
      //
      // External Storage sources (e.g. File Browser, surfaced by the
      // `external-storage` action) are deliberately NOT backed up here: their
      // files live on the SOURCE service's own volume, mounted into Nextcloud
      // at /mnt/filebrowser — never under any dataPath below — so rsync never
      // touches them, and the source service backs up its own data. Only the
      // external-mount config + filecache index travel in the pg_dump, so the
      // mount re-links automatically on restore. Do NOT add the mount path (or
      // a blanket addVolume('nextcloud')) to this backup set.
      .addVolume('main')
      .addSync({
        dataPath: '/media/startos/volumes/nextcloud/data/',
        backupPath: '/media/startos/backup/volumes/nextcloud/data/',
      })
      .addSync({
        dataPath: '/media/startos/volumes/nextcloud/config/',
        backupPath: '/media/startos/backup/volumes/nextcloud/config/',
      })
      .addSync({
        dataPath: '/media/startos/volumes/nextcloud/custom_apps/',
        backupPath: '/media/startos/backup/volumes/nextcloud/custom_apps/',
      }),
)
