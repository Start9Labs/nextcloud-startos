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
