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
mkdir -p $PGDATA
chown -R postgres:postgres /var/lib/postgresql
echo "Initializing PostgreSQL database..."
sudo -u postgres pg_ctl initdb -D $PGDATA

# Start PG server
echo "Starting PostgreSQL db server..."
sudo -u postgres pg_ctl start -D $PGDATA

# Create db user & db, set password
echo "Setting up database..."
sudo -u postgres createuser --superuser $POSTGRES_USER
sudo -u postgres createdb $POSTGRES_DB
sudo -u postgres psql -c "ALTER USER $POSTGRES_USER WITH ENCRYPTED PASSWORD '$POSTGRES_PASSWORD';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE $POSTGRES_DB TO $POSTGRES_USER;"

# Start Nextcloud, which will install
echo "Initializing Nextcloud for the first time..."
/entrypoint.sh php-fpm &
NCPID=$!

while ! sudo -u www-data -E php /var/www/html/occ status | grep "installed: true"; do
  echo "Awaiting Nextcloud installation..."
  sleep 10
done

# Install default apps
echo "Installing default apps..."
sudo -u www-data -E php /var/www/html/occ app:install calendar
sudo -u www-data -E php /var/www/html/occ app:install contacts

# Install missing indices
sudo -u www-data -E php /var/www/html/occ db:add-missing-indices

kill -TERM $NCPID
sleep 60 &
wait -n $NCPID $!

sudo -u postgres pg_ctl stop -D $PGDATA