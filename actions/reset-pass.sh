#!/bin/bash 

set -e

# Define the path to the Nextcloud installation
NEXTCLOUD_DIR="/var/www/html"

# Define the username of the user whose password you want to reset
USERNAME="embassy"

# Define the new password
OC_PASS=$(yq e '.password' /root/start9/config.yaml)

action_result_running="    {
    \"version\": \"0\",
    \"message\": \"Admin Password has been reset to Default Password\",
    \"value\": null,
    \"copyable\": false,
    \"qr\": false
}"

# Run the occ command to reset the password
echo $OC_PASS'\n'$OC_PASS'\n' | sudo -u www-data php $NEXTCLOUD_DIR/occ user:resetpassword $USERNAME


echo $action_result_running
