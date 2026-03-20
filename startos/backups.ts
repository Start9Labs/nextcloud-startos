import { sdk } from './sdk'

export const { createBackup, restoreInit } = sdk.setupBackups(
  async ({ effects }) =>
    sdk.Backups.ofVolumes('main', 'db').addSync({
      dataPath: '/media/startos/volumes/nextcloud/data/',
      backupPath: '/media/startos/backup/volumes/nextcloud/data/',
    }).addSync({
      dataPath: '/media/startos/volumes/nextcloud/config/',
      backupPath: '/media/startos/backup/volumes/nextcloud/config/',
    }).addSync({
      dataPath: '/media/startos/volumes/nextcloud/custom_apps/',
      backupPath: '/media/startos/backup/volumes/nextcloud/custom_apps/',
    }),
)
