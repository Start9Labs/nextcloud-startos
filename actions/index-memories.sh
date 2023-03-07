#!/bin/bash 

set -e

# Define the path to the Nextcloud installation
NEXTCLOUD_DIR="/var/www/html"

action_result_running="    {
    \"version\": \"0\",
    \"message\": \"Success!  Photos have been indexed and video transcoding and HLS are now enabled for the Memories application.  Please restart your Nextcloud service for changes to take effect. \",
    \"value\": null,
    \"copyable\": false,
    \"qr\": false
}"

# Run the occ command to index photos for the Memories app
sudo -u www-data php $NEXTCLOUD_DIR/occ memories:index -f > /dev/null 2>&1
yes | sudo -u www-data php $NEXTCLOUD_DIR/occ memories:video-setup > /dev/null 2>&1

echo $action_result_running
