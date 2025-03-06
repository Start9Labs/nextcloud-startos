#!/bin/bash
set -e

cp /usr/src/nextcloud/config/*.php /var/www/html/config/

php /var/www/html/occ db:add-missing-indices

php /var/www/html/occ maintenance:repair --include-expensive

mkdir -p /root/migrations
touch /root/migrations/$NEXTCLOUD_VERSION.complete
touch /root/migrations/$(echo "$NEXTCLOUD_VERSION" | sed 's/\..*//g').complete
