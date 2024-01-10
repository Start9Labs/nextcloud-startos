#!/bin/bash

set -ea

# Environment Variables
source /usr/local/bin/nextcloud.env
NEXTCLOUD_ADMIN_PASSWORD=$(cat $PASSWORD_FILE)

# User Config
DEFAULT_LOCALE=$(yq e '.default-locale' /root/start9/config.yaml)
DEFAULT_PHONE_REGION=$(yq e '.default-phone-region' /root/start9/config.yaml)

# Properties Page
cat <<EOP > /root/start9/stats.yaml
version: 2
data:
  Admin Username:
    type: string
    value: "$NEXTCLOUD_ADMIN_USER"
    description: The admin username for Nextcloud
    copyable: true
    masked: false
    qr: false
  Admin Password:
    type: string
    value: "$NEXTCLOUD_ADMIN_PASSWORD"
    description: The default admin password for Nextcloud. If this password is changed inside the Nextcloud service, the change will not be reflected here. You will no longer be able to login with the default password. To reset to the default password, use the "Reset Password" Action.
    copyable: true
    masked: true
    qr: false
  WebDAV Base LAN URL:
    type: string
    value: "$LAN_ADDRESS/remote.php/dav/"
    description: Address for WebDAV syncing over LAN
    copyable: true
    masked: false
    qr: true
  WebDAV Base Tor URL:
    type: string
    value: "$TOR_ADDRESS/remote.php/dav/"
    description: Address for WebDAV syncing over Tor
    copyable: true
    masked: false
    qr: true
EOP

_term() { 
  echo "Caught SIGTERM signal!"
  kill -TERM "$nginx_process" 2>/dev/null
  kill -TERM "$nextcloud_process" 2>/dev/null
  kill -TERM "$crond_process" 2>/dev/null
}

# Start Postgres
rm -f $PGDATA/postmaster.pid
echo "Starting PostgreSQL db server..."
sudo -u postgres pg_ctl start -D $PGDATA

# Modify config.php, add default locale settings from user config, and turn off UI update checker
sed -i "/'overwrite\.cli\.url' => .*/d" $CONFIG_FILE
sed -i "/'overwriteprotocol' => .*/d" $CONFIG_FILE
sed -i "/'check_for_working_wellknown_setup' => .*/d" $CONFIG_FILE
sed -i "/'default_locale' => .*/d" $CONFIG_FILE
sed -i "/'default_phone_region' => .*/d" $CONFIG_FILE
sed -i "/'updatechecker' => .*/d" $CONFIG_FILE
sed -i "/'updater.server.url' => .*/d" $CONFIG_FILE
sed -i "/);/d" $CONFIG_FILE
echo "  'overwrite.cli.url' => 'https://$LAN_ADDRESS',
  'overwriteprotocol' => 'https',
  'check_for_working_wellknown_setup' => true,
  'updatechecker' => false,
  'updater.server.url' => '$SERVICE_ADDRESS',
  'default_locale' => '$DEFAULT_LOCALE',
  'default_phone_region' => '$DEFAULT_PHONE_REGION',
);" >> $CONFIG_FILE

# Additional config for Memories app (if they do not exist yet) - see https://memories.gallery/file-types/
if [ -z "$(grep "'preview_max_filesize_image'" "$CONFIG_FILE")" ]; then 
  sed -i "/);/d" $CONFIG_FILE
  echo "  'preview_max_memory' => 2048,
  'preview_max_filesize_image' => 256,
  'preview_max_x' => 2048,
  'preview_max_y' => 2048,
  'enabledPreviewProviders' =>
    array (
      'OC\\Preview\\Image',
      'OC\\Preview\\HEIC',
      'OC\\Preview\\TIFF',
      'OC\\Preview\\Movie',
      'OC\\Preview\\MKV',
      'OC\\Preview\\MP4',
      'OC\\Preview\\AVI',
    ),
  );" >> $CONFIG_FILE
fi

# Start nginx web server
echo "Starting nginx server..."
nginx -g "daemon off;" &
nginx_process=$!

if sudo -u www-data -E php /var/www/html/occ | grep "$NC_VERSION"; then
  mkdir -p /root/migrations
  touch /root/migrations/$NEXTCLOUD_VERSION.complete
fi

# Start Nextcloud
echo "Starting Nextcloud frontend..."
/entrypoint.sh php-fpm &
nextcloud_process=$!

sleep 10
echo "Starting background tasks..."
busybox crond -f -l 0 -L /dev/stdout &
crond_process=$!

echo $nextcloud_process > /run/nextcloud.pid

trap _term TERM

wait $nginx_process $nextcloud_process $crond_process
