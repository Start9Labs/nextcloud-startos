#!/bin/sh

set -e 

compat duplicity restore /mnt/backup/main /root/data
compat duplicity restore /mnt/backup/nextcloud /var/www/html
compat duplicity restore /mnt/backup/db /var/lib/postgresql/13
compat duplicity restore /mnt/backup/dbconfig /etc/postgresql/13
compat duplicity restore /mnt/backup/cert /mnt/cert
