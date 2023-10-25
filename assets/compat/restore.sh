#!/bin/sh

set -e 

compat duplicity restore /mnt/backup/main /root/data
compat duplicity restore /mnt/backup/nextcloud /var/www/html
compat duplicity restore /mnt/backup/db /var/lib/postgresql
compat duplicity restore /mnt/backup/dbconfig /etc/postgresql
