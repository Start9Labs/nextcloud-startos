#!/bin/bash

set -e

action_result_running="    {
    \"version\": \"0\",
    \"message\": \"Success!  Photos have been indexed for the Memories application.  You may need to restart your Nextcloud service if changes do not take effect right away. \",
    \"value\": null,
    \"copyable\": false,
    \"qr\": false
}"

# Run the occ command to index photos for the Memories app
sudo -u www-data -E php /var/www/html/occ memories:index >&2

echo $action_result_running
