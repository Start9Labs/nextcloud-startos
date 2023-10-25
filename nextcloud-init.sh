#!/bin/bash

set -ea

# Environment Variables
LAN_ADDRESS=$(yq e '.lan-address' /root/start9/config.yaml)
TOR_ADDRESS=$(yq e '.tor-address' /root/start9/config.yaml)
SERVICE_ADDRESS='nextcloud.embassy'
TRUSTED_PROXIES="$TOR_ADDRESS $LAN_ADDRESS"
NEXTCLOUD_TRUSTED_DOMAINS="$TOR_ADDRESS $LAN_ADDRESS $SERVICE_ADDRESS"
PGDATA="/var/lib/postgresql"
POSTGRES_CONFIG="/etc/postgresql"
NEXTCLOUD_PATH="/var/www/html"
NEXTCLOUD_ADMIN_USER='admin'
PASSWORD_FILE="/root/start9/password.dat"

# Set admin password
NEXTCLOUD_ADMIN_PASSWORD=$(cat /dev/urandom | base64 | head -c 24)
echo "$NEXTCLOUD_ADMIN_PASSWORD" > "$PASSWORD_FILE"

# Clean slate
rm -rf $NEXTCLOUD_PATH/{*,.[^.]*}
rm -rf $PGDATA/{*,.[^.]*}
rm -rf $POSTGRES_CONFIG/{*,.[^.]*}

# Initialize PostgreSQL
echo 'Initializing PostgreSQL database server...'
su - postgres -c "mkdir -p $PGDATA"
chmod -R 3777 "$PGDATA"
chown -R postgres:postgres "$PGDATA"
echo "Initializing PostgreSQL database..."
su - postgres -c "pg_ctl initdb -D $PGDATA"

# Start PG server
echo "Starting PostgreSQL db server..."
su - postgres -c "pg_ctl start -D $PGDATA" &

# Wait until Postgres is ready
while ! su - postgres -c "pg_isready"; do
  sleep 1
done

# Create db user & db, set password
echo "Setting up database..."
su - postgres -c "createuser --superuser $POSTGRES_USER"
su - postgres -c "createdb $POSTGRES_DB"
su - postgres -c "psql -c \"ALTER USER $POSTGRES_USER WITH ENCRYPTED PASSWORD '$POSTGRES_PASSWORD';\""
su - postgres -c "psql -c \"grant all privileges on database $POSTGRES_DB to $POSTGRES_USER;\""

# Configure .user.ini
echo "Configuring Nextcloud frontend..."
echo 'php_value upload_max_filesize 16G' >> /var/www/html/.user.ini
echo 'php_value post_max_size 16G' >> /var/www/html/.user.ini
echo 'php_value max_input_time 3600' >> /var/www/html/.user.ini
echo 'php_value max_execution_time 3600' >> /var/www/html/.user.ini

# Start Nextcloud, which will install
echo "Initializing Nextcloud for the first time..."
/entrypoint.sh php-fpm &

while ! sudo -u www-data -E php /var/www/html/occ status | grep "installed: true"; do
echo "Awaiting Nextcloud installation..."
sleep 10
done

# Install default apps
echo "Installing default apps..."
sudo -u www-data -E php /var/www/html/occ app:install calendar
sudo -u www-data -E php /var/www/html/occ app:install contacts
