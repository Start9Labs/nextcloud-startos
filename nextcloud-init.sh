#!/bin/bash

set -ea

source /usr/local/bin/nextcloud.env

# Set admin password
NEXTCLOUD_ADMIN_PASSWORD=$(cat /dev/urandom | base64 | head -c 24)
echo "$NEXTCLOUD_ADMIN_PASSWORD" > "$PASSWORD_FILE"

# Clean slate
rm -rf $NEXTCLOUD_PATH/{*,.[^.]*}
rm -rf $PGDATA/{*,.[^.]*}

# Initialize PostgreSQL
echo 'Initializing PostgreSQL database server...'
sudo -u postgres mkdir -p $PGDATA
chown -R postgres:postgres /var/lib/postgresql
echo "Initializing PostgreSQL database..."
sudo -u postgres pg_ctl initdb -D $PGDATA

# Start PG server
echo "Starting PostgreSQL db server..."
sudo -u postgres pg_ctl start -D $PGDATA

# Wait until Postgres is ready
while ! sudo -u postgres pg_isready; do
  sleep 1
done

# Create db user & db, set password
echo "Setting up database..."
sudo -u postgres createuser --superuser $POSTGRES_USER
sudo -u postgres createdb $POSTGRES_DB
sudo -u postgres psql -c "ALTER USER $POSTGRES_USER WITH ENCRYPTED PASSWORD '$POSTGRES_PASSWORD';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE $POSTGRES_DB TO $POSTGRES_USER;"

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
