#!/bin/sh

set -e

if ! [ -f /var/www/html/config/config.php ]; then
    # nextcloud has never been initialized
    exit 0
fi

chown -R www-data:www-data /var/www/html

source /usr/local/bin/nextcloud.env

touch $INITIALIZED_FILE

chown -R postgres:postgres /var/lib/postgresql

if [ -d /var/lib/postgresql/lib ]; then
    rm -rf /var/lib/postgresql/13
    sudo -u postgres mkdir -p /var/lib/postgresql/13/main
    sudo -u postgres /usr/libexec/postgresql13/pg_ctl initdb -D /var/lib/postgresql/13/main
    rsync -a /var/lib/postgresql/lib/ /var/lib/postgresql/13/main/
    rm -rf /var/lib/postgresql/lib
fi

if [ -d /var/lib/postgresql/13/main ]; then
    echo "Starting PostgreSQL db server..."
    sudo -u postgres /usr/libexec/postgresql13/pg_ctl start -D /var/lib/postgresql/13/main

    sudo -u postgres /usr/libexec/postgresql13/pg_dumpall -c --no-role-passwords > /var/lib/postgresql/13.dump
    sudo -u postgres /usr/libexec/postgresql13/pg_ctl stop -D /var/lib/postgresql/13/main

    while [ -f /run/postgresql/.s.PGSQL.5432.lock ]; do
        sleep 1
    done   

    rm -rf /var/lib/postgresql/13 /etc/postgresql/13
fi

if [ -f /var/lib/postgresql/13.dump ]; then
    test "$PGDATA" = /var/lib/postgresql/15/main

    rm -rf /var/lib/postgresql/15
    echo 'Initializing PostgreSQL database server...'
    sudo -u postgres mkdir -p $PGDATA
    echo "Initializing PostgreSQL database..."
    sudo -u postgres pg_ctl init -D $PGDATA

    # Start PG server
    echo "Starting PostgreSQL db server..."
    sudo -u postgres pg_ctl start -D $PGDATA

    cat /var/lib/postgresql/13.dump | sudo -u postgres psql
    sudo -u postgres psql -d $POSTGRES_DB -c "ALTER USER $POSTGRES_USER WITH ENCRYPTED PASSWORD '$POSTGRES_PASSWORD';"
    sudo -u postgres psql -d $POSTGRES_DB -c "ALTER USER $POSTGRES_USER SUPERUSER;"
    sudo -u postgres psql -d $POSTGRES_DB -c "GRANT ALL PRIVILEGES ON DATABASE $POSTGRES_DB TO $POSTGRES_USER;"
    sudo -u postgres psql -d $POSTGRES_DB -c "GRANT ALL PRIVILEGES ON SCHEMA public TO $POSTGRES_USER;"

    rm /var/lib/postgresql/13.dump
else
    sudo -u postgres pg_ctl start -D $PGDATA
fi

/entrypoint.sh php-fpm &
NCPID=$!

while ! sudo -u www-data -E php /var/www/html/occ status | grep "versionstring: 26.0.8"; do
    echo "Awaiting Nextcloud update..."
    sleep 10
done

sudo -u www-data -E php /var/www/html/occ upgrade

kill -TERM $NCPID
sleep 60 &
wait -n $NCPID $!

sudo -u postgres pg_ctl stop -D $PGDATA