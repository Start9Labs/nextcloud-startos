#!/bin/bash

set -ea

_term() { 
  echo "Caught SIGTERM signal!" 
  kill -TERM "$nextcloud_process" 2>/dev/null
}
echo "Starting Container..."
TOR_ADDRESS=$(yq e '.tor-address' /root/start9/config.yaml)
LAN_ADDRESS=$(yq e '.lan-address' /root/start9/config.yaml)
SERVICE_ADDRESS='nextcloud.embassy'
NEXTCLOUD_ADMIN_USER=$(yq e '.username' /root/start9/config.yaml)
NEXTCLOUD_ADMIN_PASSWORD=$(yq e '.password' /root/start9/config.yaml)
POSTGRES_DATADIR="/var/lib/postgresql/13/main"
POSTGRES_CONFIG="/etc/postgresql/13/main"
export NEXTCLOUD_TRUSTED_DOMAINS="$TOR_ADDRESS $LAN_ADDRESS $SERVICE_ADDRESS"
export FILE="robots.txt"

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

# Changing default postgres data directory
if [ -e "$FILE" ]; then {
  echo "Existing Nextcloud database found, starting frontend..."
  echo 'Starting db server...'
  su - postgres -c "pg_ctlcluster 13 main start"
  echo 'Starting web server...'
  service apache2 restart
} else {
  #Starting and Configuring PostgreSQL
  echo 'Starting PostgreSQL database server for the first time...'
  echo 'Configuring folder permissions...'
  chown -R postgres:postgres $POSTGRES_DATADIR
  chown -R postgres:postgres $POSTGRES_CONFIG
  chmod -R a+x $POSTGRES_DATADIR
  chmod -R a+x $POSTGRES_CONFIG
  su - postgres -c "pg_createcluster 13 main"
  su - postgres -c "pg_ctlcluster 13 main start"
  echo 'Starting db server...'
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
  /docker-entrypoint.sh apache2-foreground 
}
fi

# Configuring Nextcloud
echo
echo "------------------------------------------"
echo "Nextcloud is running."
echo "------------------------------------------"
echo
echo "Please log in using your web browser."
echo "LAN Address: "$LAN_ADDRESS
echo "Tor Address: "$TOR_ADDRESS
while true;
do sleep 1000
done
trap _term SIGTERM
wait -n $nextcloud_process