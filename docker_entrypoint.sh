#!/bin/bash

set -ea

_term() { 
  echo "Caught SIGTERM signal!" 
  kill -TERM "$nextcloud_process" 2>/dev/null
}
echo "Starting Container..."
TOR_ADDRESS=$(yq e '.tor-address' /root/start9/config.yaml)
LAN_ADDRESS=$(yq e '.lan-address' /root/start9/config.yaml)
CONNECTION=$(yq e '.connection.type' /root/start9/config.yaml)
SERVICE_ADDRESS='nextcloud.embassy'
NEXTCLOUD_ADMIN_USER=$(yq e '.username' /root/start9/config.yaml)
NEXTCLOUD_ADMIN_PASSWORD=$(yq e '.password' /root/start9/config.yaml)
POSTGRES_DATADIR="/var/lib/postgresql/13"
POSTGRES_CONFIG="/etc/postgresql/13"
NC_DATADIR_APPS="/var/www/html/custom_apps"
NC_DATADIR_CONFIG="/var/www/html/config"
NC_DATADIR_DATA="/var/www/html/data"
NC_DATADIR_THEME="/var/www/html/themes/start9"
NEXTCLOUD_TRUSTED_DOMAINS="$TOR_ADDRESS $LAN_ADDRESS $SERVICE_ADDRESS"
TRUSTED_PROXIES="$TOR_ADDRESS $LAN_ADDRESS $SERVICE_ADDRESS"
FILE="/var/www/html/config/config.php"

# Properties Page
echo 'version: 2' > /root/start9/stats.yaml
echo 'data:' >> /root/start9/stats.yaml
echo '  Nextcloud Username:' >> /root/start9/stats.yaml
echo '    type: string' >> /root/start9/stats.yaml
echo '    value: "'"$NEXTCLOUD_ADMIN_USER"'"' >> /root/start9/stats.yaml
echo '    description: The admin username for Nextcloud' >> /root/start9/stats.yaml
echo '    copyable: true' >> /root/start9/stats.yaml
echo '    masked: false' >> /root/start9/stats.yaml
echo '    qr: false' >> /root/start9/stats.yaml
echo '  Nextcloud Password:' >> /root/start9/stats.yaml
echo '    type: string' >> /root/start9/stats.yaml
echo '    value: "'"$NEXTCLOUD_ADMIN_PASSWORD"'"' >> /root/start9/stats.yaml
echo '    description: The admin password for Nextcloud.' >> /root/start9/stats.yaml
echo '    copyable: true' >> /root/start9/stats.yaml
echo '    masked: true' >> /root/start9/stats.yaml
echo '    qr: false' >> /root/start9/stats.yaml


if [ -e "$FILE" ] ; then {
  echo "Existing Nextcloud database found, starting frontend..."

  echo "Modifing Configuration files"
  if [ "$CONNECTION" = "lan-only" ]; then 
    echo 'Setting LAN Only configuration...'
      sed -i "/'overwriteprotocol' =>.*/d" $FILE
      sleep 3
      sed -i "/'dbtype' => 'pgsql',/a\\ \ 'overwriteprotocol' => 'https'\," $FILE
  else 
    echo 'Setting Tor and LAN configuration...'
    sed -i "/'overwriteprotocol' =>.*/d" $FILE
  fi
  until [ -e "/etc/apache2/sites-enabled/000-default.conf" ]; do { sleep 5; } done
  sed -i 's/\#ServerName www\.example\.com.*/ServerName nextcloud.embassy\n        <IfModule mod_headers\.c>\n          Header always set Strict-Transport-Security "max-age=15552000; includeSubDomains"\n        <\/IfModule>/' /etc/apache2/sites-enabled/000-default.conf
  sed -i "s/'overwrite\.cli\.url' => .*/'overwrite\.cli\.url' => 'https\:\/\/$LAN_ADDRESS'\,/" $FILE

  echo "Changing Permissions..."
  chown -R www-data:www-data $NC_DATADIR_APPS
  chown -R www-data:www-data $NC_DATADIR_CONFIG
  chown -R www-data:www-data $NC_DATADIR_DATA
  chown -R www-data:www-data $NC_DATADIR_THEME
  chown -R postgres:postgres $POSTGRES_DATADIR
  chown -R postgres:postgres $POSTGRES_CONFIG
  chmod -R 700 $POSTGRES_DATADIR
  chmod -R 700 $POSTGRES_CONFIG
  echo 'Starting db server...'
  service postgresql start
  echo 'Starting web server...'
  touch /re.start
  exec tini -s -p SIGTERM /entrypoint.sh apache2-foreground 
} else {
  #Starting and Configuring PostgreSQL
  echo 'Starting PostgreSQL database server for the first time...'
  # echo 'Configuring folder permissions...'
  rm -f $FILE
  chown -R www-data:www-data $NC_DATADIR_APPS
  chown -R www-data:www-data $NC_DATADIR_CONFIG
  chown -R www-data:www-data $NC_DATADIR_DATA
  chown -R www-data:www-data $NC_DATADIR_THEME
  chown -R postgres:postgres $POSTGRES_DATADIR
  chown -R postgres:postgres $POSTGRES_CONFIG
  chmod -R 700 $POSTGRES_DATADIR
  chmod -R 700 $POSTGRES_CONFIG
  su - postgres -c "pg_createcluster 13 lib" 
  su - postgres -c "pg_ctlcluster 13 lib start"
  # echo 'Starting db server...'
  service postgresql start
  echo 'Creating user...'
  su - postgres -c "createuser $POSTGRES_USER"
  echo 'Creating db...'
  su - postgres -c "createdb $POSTGRES_DB"
  echo 'Setting password...'
  su - postgres -c 'psql -c "ALTER USER '$POSTGRES_USER' WITH ENCRYPTED PASSWORD '"'"$POSTGRES_PASSWORD"'"';"'
  echo 'Granting db permissions...'
  su - postgres -c 'psql -c "grant all privileges on database '$POSTGRES_DB' to '$POSTGRES_USER';"'
  echo 'Creating .pgpass file...'
  su - postgres -c 'echo "localhost:5432:'$POSTGRES_USER':'$POSTGRES_PASSWORD'" >> .pgpass'
  su - postgres -c "chmod -R 0600 .pgpass"
  chmod -R 0600 /var/lib/postgresql/.pgpass
  # Installing Nextcloud Frontend
  echo "Configuring frontend..."
  sed -i '/echo "Initializing finished"/a touch re.start && echo "Follow the White Rabbitcoin." > \/re.start' /entrypoint.sh 
  /entrypoint.sh apache2-foreground &
  echo 'php_value upload_max_filesize 16G' >> /var/www/html/.user.ini
  echo 'php_value post_max_size 16G' >> /var/www/html/.user.ini
  echo 'php_value max_input_time 3600' >> /var/www/html/.user.ini
  echo 'php_value max_execution_time 3600' >> /var/www/html/.user.ini
  until [ -e "/re.start" ]; do { sleep 21; echo 'Waiting on NextCloud Initialization...'; } done
  sleep 21
  exit 0
} 
fi

trap _term SIGTERM

wait -n $nextcloud_process