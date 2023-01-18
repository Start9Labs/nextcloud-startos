import { Backups } from "../deps.ts";

export const { createBackup, restoreBackup } = Backups.volumes("main", "nextcloud", "db", "dbconfig", "cert").build();
