#!/bin/bash

set -ea

# Environment Variables
export LAN_ADDRESS=$(yq e '.lan-address' /root/start9/config.yaml)
export TOR_ADDRESS=$(yq e '.tor-address' /root/start9/config.yaml)
export SERVICE_ADDRESS='nextcloud.embassy'
export PGDATA="/var/lib/postgresql/15"
export POSTGRES_CONFIG="/etc/postgresql/15"
export NEXTCLOUD_TRUSTED_DOMAINS="$TOR_ADDRESS $LAN_ADDRESS $SERVICE_ADDRESS"
export TRUSTED_PROXIES="$TOR_ADDRESS $LAN_ADDRESS $SERVICE_ADDRESS"
export FILE="/var/www/html/config/config.php"
export NEXTCLOUD_ADMIN_USER='admin'
export PASSWORD_FILE="/root/start9/password.dat"
export INITIALIZED_FILE=/root/initialized

if ! [ -f $INITIALIZED_FILE ]; then
  echo "Performing initialization..."
  /usr/local/bin/nextcloud-init.sh
  touch $INITIALIZED_FILE
  echo "Nextcloud initialization complete!  Ready to run..."
else
  echo "Running nextcloud..."
  exec /usr/local/bin/nextcloud-run.sh
fi

# _term() { 
#   echo "Caught SIGTERM signal!"
#   kill -TERM "$postgres_process" 2>/dev/null
#   kill -TERM "$nginx_process" 2>/dev/null
#   kill -TERM "$nextcloud_process" 2>/dev/null
#   kill -TERM "$crond_process" 2>/dev/null
# }

# echo "Starting Container..."

# # Environment Variables
# LAN_ADDRESS=$(yq e '.lan-address' /root/start9/config.yaml)
# TOR_ADDRESS=$(yq e '.tor-address' /root/start9/config.yaml)
# SERVICE_ADDRESS='nextcloud.embassy'
# PGDATA="/var/lib/postgresql/15"
# POSTGRES_CONFIG="/etc/postgresql/15"
# NEXTCLOUD_TRUSTED_DOMAINS="$TOR_ADDRESS $LAN_ADDRESS $SERVICE_ADDRESS"
# TRUSTED_PROXIES="$TOR_ADDRESS $LAN_ADDRESS $SERVICE_ADDRESS"
# FILE="/var/www/html/config/config.php"
# NEXTCLOUD_ADMIN_USER='admin'
# PASSWORD_FILE="/root/start9/password.dat"

# # User Config
# DEFAULT_LOCALE=$(yq e '.default-locale' /root/start9/config.yaml)
# DEFAULT_PHONE_REGION=$(yq e '.default-phone-region' /root/start9/config.yaml)

# if [ -e "$PASSWORD_FILE" ] && [ -s "$PASSWORD_FILE" ]; then
#   NEXTCLOUD_ADMIN_PASSWORD=$(cat "$PASSWORD_FILE")
# else
#   NEXTCLOUD_ADMIN_PASSWORD=$(cat /dev/urandom | base64 | head -c 24)
#   echo "$NEXTCLOUD_ADMIN_PASSWORD" > "$PASSWORD_FILE"
# fi


# # Check if PostgreSQL db is already initialized
# if [ -f "$PGDATA/PG_VERSION" ] && [ -d "$PGDATA/base" ]; then
#   echo "PostgreSQL database is already initialized. Skipping initialization..."
# else
#   # Initialize PostgreSQL
#   echo 'Initializing PostgreSQL database server...'
#   su - postgres -c "mkdir -p $PGDATA"
#   chmod -R 3777 "$PGDATA"
#   chown -R postgres:postgres "$PGDATA"
#   echo "Initializing PostgreSQL database..."
#   su - postgres -c "pg_ctl initdb -D $PGDATA"
# fi
# echo "Starting PostgreSQL db server..."
# su - postgres -c "pg_ctl start -D $PGDATA" &
# postgres_process=$!

# trap _term TERM
# wait $postgres_process

# # Wait until PostgreSQL server is ready
# while ! su - postgres -c "pg_isready"; do
#   sleep 1
# done

# # Check if PostgreSQL user exists
# if su - postgres -c "psql -tAc \"SELECT 1 FROM pg_roles WHERE rolname='$POSTGRES_USER'\"" | grep -q 1; then
#   echo "PostgreSQL user '$POSTGRES_USER' already exists. Skipping user creation..."
# else
#   echo 'Creating user...'
#   su - postgres -c "createuser --superuser $POSTGRES_USER"
# fi

# # Check if PostgreSQL database exists
# if su - postgres -c "psql -lqt | cut -d \| -f 1 | grep -qw $POSTGRES_DB"; then
#   echo "PostgreSQL database '$POSTGRES_DB' already exists. Skipping database creation..."
# else
#   echo 'Creating db...'
#   su - postgres -c "createdb $POSTGRES_DB"
# fi

# # Set password for PostgreSQL user
# echo 'Setting password...'
# su - postgres -c "psql -c \"ALTER USER $POSTGRES_USER WITH ENCRYPTED PASSWORD '$POSTGRES_PASSWORD';\""

# # Grant database permissions
# echo 'Granting db permissions...'
# su - postgres -c "psql -c \"grant all privileges on database $POSTGRES_DB to $POSTGRES_USER;\""

# confgPHP () {
#   # Modify config.php, add default locale settings from user config, and turn off UI update checker
#   sed -i "s/'overwrite\.cli\.url' => .*/'overwrite\.cli\.url' => 'https\:\/\/$LAN_ADDRESS'\,/" $FILE
#   sed -i "/'default_locale' => .*/d" $FILE
#   sed -i "/'default_phone_region' => .*/d" $FILE
#   sed -i "/'updatechecker' => .*/d" $FILE
#   sed -i "/);/d" $FILE
#   echo "  'overwriteprotocol' => 'https',
#   'check_for_working_wellknown_setup' => true,
#   'updatechecker' => false,
#   'default_locale' => '$DEFAULT_LOCALE',
#   'default_phone_region' => '$DEFAULT_PHONE_REGION',
#   );" >> $FILE
# }

# if [ -e "$FILE" ] ; then
#   echo "Existing Nextcloud database found, starting frontend..."
#   configPHP

#   # Start nginx web server
#   echo "Starting nginx server..."
#   #chown nginx:nginx /usr/sbin/nginx
#   nginx -g "daemon off;" &
#   nginx_process=$!

#   # Start Nextcloud
#   echo "Starting Nextcloud frontend..."
#   /entrypoint.sh php-fpm &
#   nextcloud_process=$!
#   busybox crond -f -l 0 -L /dev/stdout &
#   crond_process=$!

# else
#   echo "Starting Nextcloud for the first time..."
#   rm -rf /var/www/html/
#   # Start nginx web server
#   echo "Starting nginx server..."
#   #chown nginx:nginx /usr/sbin/nginx
#   nginx -g "daemon off;" &
#   nginx_process=$!

#   # Start Nextcloud
#   echo "Starting Nextcloud frontend..."
#   /entrypoint.sh php-fpm &
#   nextcloud_process=$!
#   busybox crond -f -l 0 -L /dev/stdout &
#   crond_process=$!
  
#   while ! [ -f $FILE ]; do
#     echo "Awaiting Nextcloud installation..."
#     sleep 1
#   done

#   # Configure .user.ini
#   echo "Configuring Nextcloud frontend..."
#   echo 'php_value upload_max_filesize 16G' >> /var/www/html/.user.ini
#   echo 'php_value post_max_size 16G' >> /var/www/html/.user.ini
#   echo 'php_value max_input_time 3600' >> /var/www/html/.user.ini
#   echo 'php_value max_execution_time 3600' >> /var/www/html/.user.ini

#   echo "Configuring php..."
#   configPHP
# fi

#   # Install default apps
#   # echo "Installing default apps..."
#   # sudo -u www-data -E php /var/www/html/occ app:install calendar > /dev/null 2>&1
#   # sudo -u www-data -E php /var/www/html/occ app:install contacts > /dev/null 2>&1
#   # sudo -u www-data php /var/www/html/occ app:install contacts > /dev/null 2>&1
#   # exit 0

# touch /re.start

# trap _term TERM

# wait $nginx_process $nextcloud_process $crond_process
