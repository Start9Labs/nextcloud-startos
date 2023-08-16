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

# Run the occ command to disable Maintenance Mode in case it gets hung
sudo -u www-data -E php $NEXTCLOUD_DIR/occ maintenance:mode --off > /dev/null 2>&1

echo $action_result_running
