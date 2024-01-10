#!/bin/bash
set -e

sudo -u www-data -E php /var/www/html/occ db:add-missing-indices

mkdir -p /root/migrations
touch /root/migrations/$NEXTCLOUD_VERSION.complete
