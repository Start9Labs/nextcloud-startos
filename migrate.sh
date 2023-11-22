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
    sudo -u postgres mkdir -p /var/lib/postgresql/13
    mv /var/lib/postgresql/lib /var/lib/postgresql/13/main
fi

if [ -d /var/lib/postgresql/13/main ]; then
    echo "Starting PostgreSQL db server..."
    sudo -u postgres /usr/libexec/postgresql13/pg_ctl start -D /var/lib/postgresql/13/main

    # Wait until Postgres is ready
    echo "Waiting for Postgres to be ready..."
    while ! sudo -u postgres /usr/libexec/postgresql13/pg_isready; do
        sleep 1
    done

    sudo -u postgres /usr/libexec/postgresql13/pg_dumpall -c -U nextcloud > /var/lib/postgresql/13.dump
    sudo -u postgres /usr/libexec/postgresql13/pg_ctl stop -D /var/lib/postgresql/13/main

    rm -rf /var/lib/postgresql/13 /etc/postgresql/13
fi

if [ -f /var/lib/postgresql/13.dump ]; then
    test "$PGDATA" = /var/lib/postgresql/15/main

    rm -rf /var/lib/postgresql/15
    echo 'Initializing PostgreSQL database server...'
    sudo -u postgres mkdir -p $PGDATA
    echo "Initializing PostgreSQL database..."
    sudo -u postgres pg_ctl initdb -D $PGDATA

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

# TODO: @kn0wmad start nextcloud so it can upgrade to v26