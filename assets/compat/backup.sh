#!/bin/sh

set -e 

mkdir -p /mnt/backup/main
mkdir -p /mnt/backup/nextcloud
mkdir -p /mnt/backup/apps
mkdir -p /mnt/backup/config
mkdir -p /mnt/backup/data
mkdir -p /mnt/backup/themes
mkdir -p /mnt/backup/db
mkdir -p /mnt/backup/dbconfig
compat backup create /mnt/backup/main /root
compat backup create /mnt/backup/nextcloud /var/www/html
compat backup create /mnt/backup/apps /var/www/html/custom_apps
compat backup create /mnt/backup/config /var/www/html/config
compat backup create /mnt/backup/data /var/www/html/data
compat backup create /mnt/backup/themes /var/www/html/themes
compat backup create /mnt/backup/db /var/lib/postgresql/13
compat backup create /mnt/backup/dbconfig /etc/postgresql/13
