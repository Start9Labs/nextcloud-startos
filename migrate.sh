#!/bin/sh

set -e

if ! [ -f /var/www/html/config/config.php ]; then
    # nextcloud has never been initialized
    exit 0
fi

chown -R www-data:www-data /var/www/html
chown -R postgres:postgres /var/lib/postgresql

source /usr/local/bin/nextcloud.env

touch $INITIALIZED_FILE

if [ -d /var/lib/postgresql/lib ]; then
    mkdir -p /var/lib/postgresql/lib.snapshot
    while ! diff -qr /var/lib/postgresql/lib /var/lib/postgresql/lib.snapshot > /dev/null; do # loop in case files change during copy
        rm -rf /var/lib/postgresql/lib.snapshot
        sudo -u postgres mkdir /var/lib/postgresql/lib.snapshot
        rsync -a /var/lib/postgresql/lib/ /var/lib/postgresql/lib.snapshot/
    done
    mv /var/lib/postgresql/lib /var/lib/postgresql/lib.bak
fi

if [ -d /var/lib/postgresql/lib.snapshot ]; then
    rm -rf /var/lib/postgresql/13
    sudo -u postgres mkdir -p /var/lib/postgresql/13/main
    sudo -u postgres /usr/libexec/postgresql13/pg_ctl initdb -D /var/lib/postgresql/13/main
    rsync -a /var/lib/postgresql/lib.snapshot/ /var/lib/postgresql/13/main/
    rm -rf /var/lib/postgresql/lib.snapshot
fi

if [ -d /var/lib/postgresql/13/main ]; then
    chown -R postgres:postgres /var/lib/postgresql
    chmod -R 750 /var/lib/postgresql
    echo "Starting PostgreSQL db server..."
    sudo -u postgres /usr/libexec/postgresql13/pg_ctl start -D /var/lib/postgresql/13/main

    sudo -u postgres /usr/libexec/postgresql13/pg_dump --format=tar -C $POSTGRES_DB -f /var/lib/postgresql/13.dump
    sudo -u postgres /usr/libexec/postgresql13/pg_ctl stop -D /var/lib/postgresql/13/main

    while [ -f /run/postgresql/.s.PGSQL.5432.lock ]; do
        sleep 1
    done   

    rm -rf /var/lib/postgresql/13
fi

if [ -f /var/lib/postgresql/13.dump ]; then
    test "$PGDATA" = /var/lib/postgresql/15/main

    rm -rf /var/lib/postgresql/15
    echo 'Initializing PostgreSQL database server...'
    sudo -u postgres mkdir -p $PGDATA.tmp
    echo "Initializing PostgreSQL database..."
    sudo -u postgres pg_ctl initdb -D $PGDATA.tmp

    # Start PG server
    echo "Starting PostgreSQL db server..."
    sudo -u postgres pg_ctl start -D $PGDATA.tmp

    sudo -u postgres createuser --superuser $POSTGRES_USER
    sudo -u postgres createdb $POSTGRES_DB
    sudo -u postgres pg_restore -e -d $POSTGRES_DB /var/lib/postgresql/13.dump
    sudo -u postgres psql -d $POSTGRES_DB -c "ALTER USER $POSTGRES_USER WITH ENCRYPTED PASSWORD '$POSTGRES_PASSWORD';"
    sudo -u postgres psql -d $POSTGRES_DB -c "GRANT ALL PRIVILEGES ON DATABASE $POSTGRES_DB TO $POSTGRES_USER;"
    sudo -u postgres psql -d $POSTGRES_DB -c "GRANT ALL PRIVILEGES ON SCHEMA public TO $POSTGRES_USER;"

    sudo -u postgres pg_ctl stop -D $PGDATA.tmp

    rm -f /var/lib/postgresql/13.dump
fi

rm -rf /var/lib/postgresql/lib.bak
mv $PGDATA.tmp $PGDATA