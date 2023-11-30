#!/bin/sh

set -e

if ! [ -f /var/www/html/config/config.php ]; then
    # nextcloud has never been initialized
    exit 0
fi

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

    # Wait until Postgres is ready
    echo "Waiting for Postgres to be ready..."
    while ! sudo -u postgres /usr/libexec/postgresql13/pg_isready; do
        sleep 1
    done

    sudo -u postgres /usr/libexec/postgresql13/pg_dumpall -c --no-role-passwords -U nextcloud > /var/lib/postgresql/13.dump
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

    # Wait until Postgres is ready
    while ! sudo -u postgres pg_isready; do
        sleep 1
    done

    cat /var/lib/postgresql/13.dump | sudo -u postgres psql -U nextcloud
    sudo -u postgres pg_ctl stop -D $PGDATA
    rm /var/lib/postgresql/13.dump
fi

sudo -u www-data /var/www/html/occ maintenance:install
