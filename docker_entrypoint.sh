#!/bin/bash

set -ea

# Environment Variables
LAN_ADDRESS=$(yq e '.lan-address' /root/start9/config.yaml)
TOR_ADDRESS=$(yq e '.tor-address' /root/start9/config.yaml)
SERVICE_ADDRESS='nextcloud.embassy'
PGDATA="/var/lib/postgresql"
POSTGRES_CONFIG="/etc/postgresql"
NEXTCLOUD_TRUSTED_DOMAINS="$TOR_ADDRESS $LAN_ADDRESS $SERVICE_ADDRESS"
TRUSTED_PROXIES="$TOR_ADDRESS $LAN_ADDRESS $SERVICE_ADDRESS"
FILE="/var/www/html/config/config.php"  
PASSWORD_FILE="/root/start9/password.dat"
INITIALIZED_FILE=/root/initialized

if ! [ -f $INITIALIZED_FILE ]; then
  echo "Performing initialization..."
  /usr/local/bin/nextcloud-init.sh
  touch $INITIALIZED_FILE
  echo "Nextcloud initialization complete!  Ready to run..."
else
  echo "Running nextcloud..."
  exec /usr/local/bin/nextcloud-run.sh
fi
