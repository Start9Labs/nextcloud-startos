#!/bin/bash 

set -e

action_result_running="    {
    \"version\": \"0\",
    \"message\": \"Success!  You can now use the Map inside your Memories application. \",
    \"value\": null,
    \"copyable\": false,
    \"qr\": false
}"

# Run the occ command to setup map for the Memories app
yes | sudo -u www-data -E php /var/www/html/occ memories:places-setup >&2

echo $action_result_running
