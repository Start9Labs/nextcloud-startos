#!/bin/bash 
set -e

# Define the path to the Nextcloud installation
NEXTCLOUD_DIR="/var/www/html"

action_result_running="    {
    \"version\": \"0\",
    \"message\": \"Photos have been successfully indexed by Memories\",
    \"value\": null,
    \"copyable\": false,
    \"qr\": false
}"

# Run the occ command to reset the password
sudo -u www-data php $NEXTCLOUD_DIR/occ memories:index > /dev/null 2>&1
echo "Y" | sudo -u www-data php $NEXTCLOUD_DIR/occ memories:video-setup > /dev/null 2>&1

echo $action_result_running
