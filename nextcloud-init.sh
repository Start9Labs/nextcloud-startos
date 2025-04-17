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
su -c "/usr/lib/postgresql/15/bin/pg_ctl initdb -D $PGDATA" postgres

# Start PG server
echo "Starting PostgreSQL db server..."
su -c "/usr/lib/postgresql/15/bin/pg_ctl start -D $PGDATA" postgres

# Create db user & db, set password
echo "Setting up database..."
su -c "createuser --superuser $POSTGRES_USER" postgres
su -c "createdb $POSTGRES_DB" postgres
su - postgres -c "psql -c \"ALTER USER $POSTGRES_USER WITH ENCRYPTED PASSWORD '$POSTGRES_PASSWORD';\""
su - postgres -c "psql -c \"GRANT ALL PRIVILEGES ON DATABASE $POSTGRES_DB TO $POSTGRES_USER;\""

# Start Nextcloud, which will install
echo "Initializing Nextcloud for the first time..."
/entrypoint.sh php-fpm &
NCPID=$!

while ! runuser -u www-data -- php /var/www/html/occ status | grep "installed: true"; do
  echo "Awaiting Nextcloud installation..."
  sleep 10
done

# Install default apps
echo "Installing default apps..."
runuser -u www-data -- php /var/www/html/occ app:install calendar
runuser -u www-data -- php /var/www/html/occ app:install contacts

# Install missing indices
runuser -u www-data -- php /var/www/html/occ db:add-missing-indices

# Set background tasks to Cron
runuser -u www-data -- php /var/www/html/occ background:Cron

kill -TERM $NCPID
sleep 60 &
wait -n $NCPID $!

su -c "/usr/lib/postgresql/15/bin/pg_ctl stop -D $PGDATA" postgres