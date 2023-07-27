#!/bin/bash

set -ea

_term() { 
  echo "Caught SIGTERM signal!"
  kill -TERM "$nextcloud_process" 2>/dev/null
  kill -TERM "$nginx_process" 2>/dev/null
  kill -TERM "$postgres_process" 2>/dev/null
}

echo "Starting Container..."

LAN_ADDRESS=$(yq e '.lan-address' /root/start9/config.yaml)
TOR_ADDRESS=$(yq e '.tor-address' /root/start9/config.yaml)
SERVICE_ADDRESS='nextcloud.embassy'
NEXTCLOUD_ADMIN_USER='admin'
PGDATA="/var/lib/postgresql/data"
POSTGRES_CONFIG="/etc/postgresql/15"
NEXTCLOUD_TRUSTED_DOMAINS="$TOR_ADDRESS $LAN_ADDRESS $SERVICE_ADDRESS"
TRUSTED_PROXIES="$TOR_ADDRESS $LAN_ADDRESS $SERVICE_ADDRESS"
FILE="/var/www/html/config/config.php"

# User Config
# DEFAULT_LOCALE=$(yq e '.default-locale' /root/start9/config.yaml)
# DEFAULT_PHONE_REGION=$(yq e '.default-phone-region' /root/start9/config.yaml)

# Properties Page
echo 'version: 2' > /root/start9/stats.yaml
echo 'data:' >> /root/start9/stats.yaml
echo '  Nextcloud Admin Username:' >> /root/start9/stats.yaml
echo '    type: string' >> /root/start9/stats.yaml
echo '    value: "'"$NEXTCLOUD_ADMIN_USER"'"' >> /root/start9/stats.yaml
echo '    description: The admin username for Nextcloud' >> /root/start9/stats.yaml
echo '    copyable: true' >> /root/start9/stats.yaml
echo '    masked: false' >> /root/start9/stats.yaml
echo '    qr: false' >> /root/start9/stats.yaml
echo '  Nextcloud Admin Default Password:' >> /root/start9/stats.yaml
echo '    type: string' >> /root/start9/stats.yaml
echo '    value: "'"$NEXTCLOUD_ADMIN_PASSWORD"'"' >> /root/start9/stats.yaml
echo '    description: The default admin password for Nextcloud. If this password is changed inside the Nextcloud service, the change will not be reflected here. You will no longer be able to login with the default password. To reset to the default password, use the "Reset Password" Action.' >> /root/start9/stats.yaml
echo '    copyable: true' >> /root/start9/stats.yaml
echo '    masked: true' >> /root/start9/stats.yaml
echo '    qr: false' >> /root/start9/stats.yaml
echo '  Nextcloud WebDAV Base LAN URL:' >> /root/start9/stats.yaml
echo '    type: string' >> /root/start9/stats.yaml
echo '    value: "'"$LAN_ADDRESS/remote.php/dav/"'"' >> /root/start9/stats.yaml
echo '    description: Address for WebDAV syncing over LAN' >> /root/start9/stats.yaml
echo '    copyable: true' >> /root/start9/stats.yaml
echo '    masked: false' >> /root/start9/stats.yaml
echo '    qr: true' >> /root/start9/stats.yaml
echo '  Nextcloud WebDAV Base Tor URL:' >> /root/start9/stats.yaml
echo '    type: string' >> /root/start9/stats.yaml
echo '    value: "'"$TOR_ADDRESS/remote.php/dav/"'"' >> /root/start9/stats.yaml
echo '    description: Address for WebDAV syncing over Tor' >> /root/start9/stats.yaml
echo '    copyable: true' >> /root/start9/stats.yaml
echo '    masked: false' >> /root/start9/stats.yaml
echo '    qr: true' >> /root/start9/stats.yaml

if [ -e "$FILE" ] ; then
  NEXTCLOUD_ADMIN_PASSWORD=$(cat /root/start9/password.dat)
fi
  
# Initialize and Configure PostgreSQL
echo 'Initializing PostgreSQL database server...'
#NEXTCLOUD_ADMIN_PASSWORD=$(cat /dev/urandom | tr -dc '[:alnum:]' | head -c 24)
NEXTCLOUD_ADMIN_PASSWORD=$(cat /dev/urandom | base64 | head -c 24)
echo $NEXTCLOUD_ADMIN_PASSWORD >> /root/start9/password.dat
su - postgres -c "mkdir $PGDATA"
chmod -R 0700 $PGDATA
chown -R postgres:postgres $PGDATA
# Initialize db & Start server
echo "Initializing Postgres Database..."
su - postgres -c "pg_ctl initdb -D $PGDATA"
echo "Starting Postgres db server..."
su - postgres -c "pg_ctl start -D $PGDATA" &
postgres_process=$!
# exec /usr/local/bin/start-postgres.sh postgres &

# Setup user/creds/db, grant permissions, config .pgpass
echo 'Creating user...'
# possible race condition here on install, sleep fixes
sleep 7s
su - postgres -c "createuser $POSTGRES_USER"
echo 'Creating db...'
su - postgres -c "createdb $POSTGRES_DB"
echo 'Setting password...'
su - postgres -c 'psql -c "ALTER USER '$POSTGRES_USER' WITH ENCRYPTED PASSWORD '"'"$POSTGRES_PASSWORD"'"';"'
echo 'Granting db permissions...'
su - postgres -c 'psql -c "grant all privileges on database '$POSTGRES_DB' to '$POSTGRES_USER';"'
#echo 'Creating .pgpass file...'
#su - postgres -c 'echo "localhost:5432:'$POSTGRES_USER':'$POSTGRES_PASSWORD'" >> .pgpass'
#su - postgres -c "chmod -R 0600 .pgpass"
#chmod -R 0600 /var/lib/postgresql/.pgpass

# Start nginx web server
echo "Starting nginx server..."
#chown nginx:nginx /usr/sbin/nginx
nginx -g "daemon off;" &
nginx_process=$!

# Install Nextcloud Frontend
#echo "Configuring Nextcloud frontend..."
#echo 'php_value upload_max_filesize 16G' >> /var/www/html/.user.ini
#echo 'php_value post_max_size 16G' >> /var/www/html/.user.ini
#echo 'php_value max_input_time 3600' >> /var/www/html/.user.ini
#echo 'php_value max_execution_time 3600' >> /var/www/html/.user.ini

# Start Nextcloud
echo "Starting Nextcloud frontend..."
#chown www-data:www-data /usr/local/sbin/php-fpm
#chown www-data:www-data /proc/self/fd/{1,2}
exec /entrypoint.sh php-fpm &
nextcloud_process=$!

# Install default apps
#echo "Installing default apps..."
#su -u www-data php-fpm /var/www/html/occ app:install calendar > /dev/null 2>&1
#su -u www-data php-fpm /var/www/html/occ app:install contacts > /dev/null 2>&1
#exit 0

trap _term TERM

wait $postgres_process $nginx_process $nextcloud_process

# if [ -e "$FILE" ] ; then
#   echo "Existing Nextcloud database found, starting frontend..."

#   # Check certificate
#   a2enmod ssl
#   a2ensite default-ssl
#   echo "Fetching system cert..."
#   while ! [ -e /mnt/cert/main.key.pem ]; do
#     echo "Waiting for system cert key file..."
#     sleep 1
#   done
#   cp /mnt/cert/main.key.pem /etc/ssl/private/ssl-cert-snakeoil.key
#   while ! [ -e /mnt/cert/main.cert.pem ]; do
#     echo "Waiting for system cert..."
#     sleep 1
#   done
#   cp /mnt/cert/main.cert.pem /etc/ssl/certs/ssl-cert-snakeoil.pem

#   # config.php modification
#   echo "Modifying Configuration files..."
#   sed -i "/'overwriteprotocol' =>.*/d" $FILE
#   sleep 3
#   sed -i "/'dbtype' => 'pgsql',/a\\ \ 'overwriteprotocol' => 'https'\," $FILE

#   until [ -e "/etc/apache2/sites-enabled/000-default.conf" ]; do { sleep 5; } done
#   sed -i 's/\#ServerName www\.example\.com.*/ServerName nextcloud.embassy\n        <IfModule mod_headers\.c>\n          Header always set Strict-Transport-Security "max-age=15552000; includeSubDomains"\n        <\/IfModule>/' /etc/apache2/sites-enabled/000-default.conf
#   sed -i "s/'overwrite\.cli\.url' => .*/'overwrite\.cli\.url' => 'https\:\/\/$LAN_ADDRESS'\,/" $FILE

#   # Add default locale and phone region from user config and turn off update checker from UI
#     sed -i "/'default_locale' => .*/d" $FILE
#   sed -i "/'default_phone_region' => .*/d" $FILE
#   sed -i "/'updatechecker' => .*/d" $FILE
#   sed -i "/'updater.server.url' => .*/d" $FILE
#   sed -i "/);/d" $FILE
#   echo "  'default_locale' => '$DEFAULT_LOCALE',
#   'default_phone_region' => '$DEFAULT_PHONE_REGION',
#   'updatechecker' => false,
#   'updater.server.url' => '$SERVICE_ADDRESS',
#   );" >> $FILE

#   # set additional config.php settings for Memories app (if they do not exist yet)
#   # see https://github.com/pulsejet/memories/wiki/Configuration and https://github.com/pulsejet/memories/wiki/File-Type-Support
#   if [ -z "$(grep "'preview_max_filesize_image'" "$FILE")" ]; then 
#     sed -i "/);/d" $FILE
#     echo "  'preview_max_memory' => 2048,
#     'preview_max_filesize_image' => 256,
#     'preview_max_x' => 2048,
#     'preview_max_y' => 2048,
#     'enabledPreviewProviders' =>
#       array (
#         'OC\\Preview\\Image',
#         'OC\\Preview\\HEIC',
#         'OC\\Preview\\TIFF',
#         'OC\\Preview\\Movie',
#         'OC\\Preview\\MKV',
#         'OC\\Preview\\MP4',
#         'OC\\Preview\\AVI',
#       ),
#     );" >> $FILE
#   fi
  
  # echo "Changing Permissions..."
  # chown -R postgres:postgres $PGDATA
  # chown -R postgres:postgres $POSTGRES_CONFIG
  # chmod -R 700 $PGDATA
  # chmod -R 700 $POSTGRES_CONFIG
  # echo 'Starting db server...'
  # service postgresql start
  # echo 'Starting web server...' 
  # touch /re.start
  # /entrypoint.sh apache2-foreground &
  # nextcloud_process=$!
  # busybox crond -f -l 0 -L /dev/stdout &
  # =$!
# else


# rm -f $FILE
# chown -R postgres:postgres $POSTGRES_CONFIG
# chmod -R 0700 $POSTGRES_CONFIG

# sed -i '/echo "Initializing finished"/a touch re.start && echo "Follow the White Rabbit." > \/re.start' /entrypoint.sh 

# /entrypoint.sh apache2-foreground &

# until [ -e "/re.start" ]; do { sleep 21; echo 'Waiting on NextCloud Initialization...'; } done
