#!/bin/sh

set -e 

mkdir -p /mnt/backup/main
mkdir -p /mnt/backup/nextcloud
mkdir -p /mnt/backup/db
mkdir -p /mnt/backup/dbconfig
compat backup create /mnt/backup/main /root
compat backup create /mnt/backup/nextcloud /var/www/html
compat backup create /mnt/backup/db /var/lib/postgresql/13
compat backup create /mnt/backup/dbconfig /etc/postgresql/13
