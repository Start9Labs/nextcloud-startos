import { sdk } from './sdk'
import { rm } from 'fs/promises'
import {
  PGDATA,
  POSTGRES_DB,
  POSTGRES_PATH,
  POSTGRES_USER,
} from './utils'
import { configPhp } from './fileModels/config.php'

const DUMP_FILE = '/main/nextcloud-db.dump'
const MAIN_MOUNT = '/main'

function pgBackupMounts() {
  return sdk.Mounts.of()
    .mountVolume({
      volumeId: 'db',
      mountpoint: POSTGRES_PATH,
      readonly: false,
      subpath: null,
    })
    .mountVolume({
      volumeId: 'main',
      mountpoint: MAIN_MOUNT,
      readonly: false,
      subpath: null,
    })
}

export const { createBackup, restoreInit } = sdk.setupBackups(
  async ({ effects }) =>
    sdk.Backups.ofVolumes('main')
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
      })
      .setPreBackup(async (effects) => {
        await sdk.SubContainer.withTemp(
          effects,
          { imageId: 'postgres' },
          pgBackupMounts(),
          'pg-dump',
          async (sub) => {
            await sub.execFail(
              [
                'pg_ctl',
                'start',
                '-D',
                PGDATA,
                '-w',
                '-o',
                '-c listen_addresses=',
              ],
              { user: 'postgres' },
            )
            await sub.execFail(
              [
                'pg_dump',
                '-U',
                POSTGRES_USER,
                '-Fc',
                '-f',
                DUMP_FILE,
                POSTGRES_DB,
              ],
              { user: 'postgres' },
            )
            await sub.execFail(['pg_ctl', 'stop', '-D', PGDATA, '-w'], {
              user: 'postgres',
            })
          },
        )
      })
      .setPostBackup(async () => {
        await rm('/media/startos/volumes/main/nextcloud-db.dump').catch(
          () => {},
        )
      })
      .setPostRestore(async (effects) => {
        const config = await configPhp.read().once()
        const dbPassword = config?.dbpassword
        if (!dbPassword)
          throw new Error('No dbpassword found in restored config.php')

        await sdk.SubContainer.withTemp(
          effects,
          { imageId: 'postgres' },
          pgBackupMounts(),
          'pg-restore',
          async (sub) => {
            await sub.execFail(
              ['initdb', '-D', PGDATA, '-U', POSTGRES_USER],
              { user: 'postgres' },
            )
            await sub.execFail(
              [
                'pg_ctl',
                'start',
                '-D',
                PGDATA,
                '-w',
                '-o',
                '-c listen_addresses=',
              ],
              { user: 'postgres' },
            )
            await sub.execFail(
              ['createdb', '-U', POSTGRES_USER, POSTGRES_DB],
              { user: 'postgres' },
            )
            await sub.execFail(
              [
                'pg_restore',
                '-U',
                POSTGRES_USER,
                '-d',
                POSTGRES_DB,
                '--no-owner',
                DUMP_FILE,
              ],
              { user: 'postgres' },
            )
            await sub.execFail(
              [
                'psql',
                '-U',
                POSTGRES_USER,
                '-d',
                POSTGRES_DB,
                '-c',
                `ALTER USER ${POSTGRES_USER} WITH PASSWORD '${dbPassword}'`,
              ],
              { user: 'postgres' },
            )
            await sub.execFail(['pg_ctl', 'stop', '-D', PGDATA, '-w'], {
              user: 'postgres',
            })
            await sub.execFail(['rm', '-f', DUMP_FILE], { user: 'root' })
          },
        )
      }),
)
