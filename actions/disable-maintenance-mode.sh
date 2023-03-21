#!/bin/bash 

set -e

# Define the path to the Nextcloud installation
NEXTCLOUD_DIR="/var/www/html"

action_result_running="    {
    \"version\": \"0\",
    \"message\": \"Success!  Maintenance Mode has been disabled.  You may need to wait 1-2min and refresh your UI page. \",
    \"value\": null,
    \"copyable\": false,
    \"qr\": false
}"

# Run the occ command to index photos for the Memories app
sudo -u www-data php $NEXTCLOUD_DIR/occ maintenance:mode --off > /dev/null 2>&1
# yes | sudo -u www-data php $NEXTCLOUD_DIR/occ memories:video-setup > /dev/null 2>&1

echo $action_result_running
