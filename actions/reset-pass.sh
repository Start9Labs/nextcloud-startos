#!/bin/bash 

set -e

# Define the path to the Nextcloud installation
NEXTCLOUD_DIR="/var/www/html"

# Get the username of the user whose password you want to reset
cat > input.json
USERNAME=$(jq -r '.["admin-user"]' input.json)
rm input.json

# Define the new password
OC_PASS=$(cat /root/start9/password.dat)

action_result_running="    {
    \"version\": \"0\",
    \"message\": \"Admin Password has been reset to the default password.  You can find the password under Properties.\",
    \"value\": null,
    \"copyable\": false,
    \"qr\": false
}"

# Run the occ command to reset the password
printf "$OC_PASS\n$OC_PASS\n" | sudo -u www-data -E php $NEXTCLOUD_DIR/occ user:resetpassword $USERNAME >&2

echo $action_result_running
