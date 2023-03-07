#!/bin/bash 

set -e

# Define the path to the Nextcloud installation
NEXTCLOUD_DIR="/var/www/html"

action_result_running="    {
    \"version\": \"0\",
    \"message\": \"Success!   The machine learning models have been downloaded successfully. \",
    \"value\": null,
    \"copyable\": false,
    \"qr\": false
}"

# Run the occ command to download machine learning models for the Recognize app
sudo -u www-data php $NEXTCLOUD_DIR/occ recognize:download-models > /dev/null 2>&1

echo $action_result_running
