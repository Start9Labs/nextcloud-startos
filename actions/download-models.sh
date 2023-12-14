#!/bin/bash 

set -e

action_result_running="    {
    \"version\": \"0\",
    \"message\": \"Success!  The machine learning models have been downloaded successfully. \",
    \"value\": null,
    \"copyable\": false,
    \"qr\": false
}"

# Run the occ command to download machine learning models for the Recognize app
sudo -u www-data -E php /var/www/html/occ recognize:download-models >&2

echo $action_result_running
