#!/bin/sh

set -e 

mkdir -p /mnt/backup/main
mkdir -p /mnt/backup/nextcloud
mkdir -p /mnt/backup/db
mkdir -p /mnt/backup/dbconfig
compat duplicity create /mnt/backup/main /root/data
compat duplicity create /mnt/backup/nextcloud /var/www/html
compat duplicity create /mnt/backup/db /var/lib/postgresql
compat duplicity create /mnt/backup/dbconfig /etc/postgresql
