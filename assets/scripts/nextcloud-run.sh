#!/bin/bash

set -ea

# User Config
DEFAULT_LOCALE=$(jq e '.default-locale' /root/store.json)
DEFAULT_PHONE_REGION=$(jq e '.default-phone-region' /root/store.json)
WEBDAV_MAX_UPLOAD_FILE_SIZE_LIMIT=$(jq e '.webdav.max-upload-file-size-limit' /root/store.json)
PRIMARY_URL=$(jq e '.url' /root/store.json)

_term() { 
  echo "Caught SIGTERM signal!"
  kill -TERM "$nginx_process" 2>/dev/null
  kill -TERM "$nextcloud_process" 2>/dev/null
  kill -TERM "$crond_process" 2>/dev/null
}

# Ensure postgresql is owned by postgres after alpine migration
OWNER=$(stat -c "%U" /var/lib/postgresql)
if [ "$OWNER" != 'postgres' ]; then
  chown -R postgres:postgres /var/lib/postgresql
fi

# Start Postgres
rm -f $PGDATA/postmaster.pid
echo "Starting PostgreSQL db server..."
su -c "/usr/lib/postgresql/15/bin/pg_ctl start -D $PGDATA" postgres

# Modify config.php, add default locale settings from user config, and turn off UI update checker
sed -i "/'filelocking\.enabled' => .*/d" $CONFIG_FILE
sed -i "/'memcache\.locking' => .*/d" $CONFIG_FILE
sed -i "/^  'memcache\.local' => /a \  'filelocking.enabled' => true, \n  'memcache.locking' => '\\\\\\\OC\\\\\\\Memcache\\\\\\\APCu'," $CONFIG_FILE
sed -i "/'overwrite\.cli\.url' => .*/d" $CONFIG_FILE
sed -i "/'overwriteprotocol' => .*/d" $CONFIG_FILE
sed -i "/'check_for_working_wellknown_setup' => .*/d" $CONFIG_FILE
sed -i "/'default_locale' => .*/d" $CONFIG_FILE
sed -i "/'default_phone_region' => .*/d" $CONFIG_FILE
sed -i "/'updatechecker' => .*/d" $CONFIG_FILE
sed -i "/);/d" $CONFIG_FILE
sed -i "/'integrity\.check\.disabled' => .*/d" $CONFIG_FILE
sed -i "/'maintenance_window_start' => .*/d" $CONFIG_FILE
echo "  'overwrite.cli.url' => '$PRIMARY_URL',
  'overwriteprotocol' => 'https',
  'check_for_working_wellknown_setup' => true,
  'updatechecker' => false,
  'default_locale' => '$DEFAULT_LOCALE',
  'default_phone_region' => '$DEFAULT_PHONE_REGION',
  'integrity.check.disabled' => 'true',
  'maintenance_window_start' => '$MAINTENANCE_WINDOW_START',
);" >> $CONFIG_FILE
sed -i "s/0 => 'localhost'/0 => 'localhost:443'/g" $CONFIG_FILE
sed -i "s/3 => 'nextcloud.startos'/3 => 'nextcloud.startos:443'/g" $CONFIG_FILE

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

mkdir -p /root/migrations

# Ensure /var/www/html is owned by www-data after alpine migration
HTML_OWNER=$(stat -c "%U" /var/www/html)
if [ "$HTML_OWNER" != 'www-data' ]; then
  chown -R www-data:www-data /var/www/html
fi

if runuser -u www-data -- php /var/www/html/occ | grep "$NEXTCLOUD_VERSION"; then
  touch /root/migrations/$NEXTCLOUD_VERSION.complete
  touch /root/migrations/$(echo "$NEXTCLOUD_VERSION" | sed 's/\..*//g').complete
fi

EXISTING_NEXTCLOUD_ADMIN_USER=$(runuser -u www-data -- php /var/www/html/occ user:list | grep -q "embassy" && echo "embassy" || echo "admin")

chmod g+x /root
chmod g+rwx /root/migrations
chmod -R g+rw /root/migrations
chown -R root:www-data /root

# Start Nextcloud
echo "Starting Nextcloud frontend..."
/entrypoint.sh php-fpm &
nextcloud_process=$!

# Configure .user.ini
echo "Configuring Nextcloud frontend..."
sed -i "/php_value upload_max_filesize .*/d" $PHP_USER_FILE
sed -i "/php_value post_max_size .*/d" $PHP_USER_FILE
sed -i "/php_value max_input_time .*/d" $PHP_USER_FILE
sed -i "/php_value max_execution_time .*/d" $PHP_USER_FILE
echo 'php_value upload_max_filesize 16G' >> $PHP_USER_FILE
echo 'php_value post_max_size 16G' >> $PHP_USER_FILE
echo 'php_value max_input_time 3600' >> $PHP_USER_FILE
echo 'php_value max_execution_time 3600' >> $PHP_USER_FILE

sleep 10
echo "Starting background tasks..."
cron -f -L 8 &
crond_process=$!

echo $nextcloud_process > /run/nextcloud.pid

trap _term TERM

wait $nginx_process $nextcloud_process $crond_process
