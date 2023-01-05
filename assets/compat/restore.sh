#!/bin/sh

set -e 

compat backup restore /mnt/backup/main /root
compat backup restore /mnt/backup/nextcloud /var/www/html
compat backup restore /mnt/backup/db /var/lib/postgresql/13
compat backup restore /mnt/backup/dbconfig /etc/postgresql/13
