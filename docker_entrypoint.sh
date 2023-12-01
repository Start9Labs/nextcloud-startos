#!/bin/bash

set -ea

# Environment Variables
source /usr/local/bin/nextcloud.env

if ! [ -f $INITIALIZED_FILE ]; then
  echo "Performing initialization..."
  /usr/local/bin/nextcloud-init.sh
  touch $INITIALIZED_FILE
  echo "Nextcloud initialization complete!  Ready to run..."
else
  echo "Running nextcloud..."
  exec /usr/local/bin/nextcloud-run.sh
fi
