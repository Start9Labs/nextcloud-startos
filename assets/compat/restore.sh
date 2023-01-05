#!/bin/sh

set -e 

compat backup restore /mnt/backup/main /root
compat backup restore /mnt/backup/nextcloud /var/www/html
compat backup restore /mnt/backup/apps /var/www/html/custom_apps
compat backup restore /mnt/backup/config /var/www/html/config
compat backup restore /mnt/backup/data /var/www/html/data
compat backup restore /mnt/backup/themes /var/www/html/themes
compat backup restore /mnt/backup/db /var/lib/postgresql/13
compat backup restore /mnt/backup/dbconfig /etc/postgresql/13
