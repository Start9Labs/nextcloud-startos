#!/bin/sh

VERSION=$(</dev/stdin)

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
    while ! diff -qr /var/lib/postgresql/lib /var/lib/postgresql/lib.snapshot; do # loop in case files change during copy
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
    sudo -u postgres mkdir -p $PGDATA
    echo "Initializing PostgreSQL database..."
    sudo -u postgres pg_ctl initdb -D $PGDATA

    # Start PG server
    echo "Starting PostgreSQL db server..."
    sudo -u postgres pg_ctl start -D $PGDATA

    sudo -u postgres createuser --superuser $POSTGRES_USER
    sudo -u postgres createdb $POSTGRES_DB
    sudo -u postgres pg_restore -e -d $POSTGRES_DB /var/lib/postgresql/13.dump
    sudo -u postgres psql -d $POSTGRES_DB -c "ALTER USER $POSTGRES_USER WITH ENCRYPTED PASSWORD '$POSTGRES_PASSWORD';"
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

kill -TERM $NCPID
sleep 60 &
wait -n $NCPID $!

sudo -u www-data -E php /var/www/html/occ upgrade
sudo -u www-data -E php /var/www/html/occ db:add-missing-indices

if [ $VERSION != "25.0.5" ]; then
cat > $STARTOS_CONFIG_FILE << EOF
default-locale: en_US
default-phone-region: US
EOF
fi

sudo -u postgres pg_ctl stop -D $PGDATA

rm -rf /var/lib/postgresql/lib.bak
