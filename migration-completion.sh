#!/bin/bash
set -e

mkdir -p /root/migrations
touch /root/migrations/$NEXTCLOUD_VERSION.complete
touch /root/migrations/$(echo "$NEXTCLOUD_VERSION" | sed 's/\..*//g').complete