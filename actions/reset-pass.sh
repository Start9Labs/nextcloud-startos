#!/bin/bash 

set -e

# Define the path to the Nextcloud installation
NEXTCLOUD_DIR="/var/www/html"
CURRENT_ADMIN_USERNAME=$(yq e '.data.["Nextcloud Admin Username"].value' /root/start9/stats.yaml)

# Get the username of the user whose password you want to reset
cat > input.json
RESET_MODE=$(yq e '.admin-user.reset-mode' input.json)
NEW_ADMIN_USERNAME=$([[ "$RESET_MODE" == "password" ]] && echo $CURRENT_ADMIN_USERNAME || echo $(yq e '.admin-user.new-admin-username' input.json))
rm input.json

# Define the new password
OC_PASS=$(cat /root/start9/password.dat)

action_result_running="    {
    \"version\": \"0\",
    \"message\": \"$([[ "$CURRENT_ADMIN_USERNAME" == "$NEW_ADMIN_USERNAME" ]] && echo "Admin Password has been reset to Default Password for $CURRENT_ADMIN_USERNAME" || echo "The default Nextcloud admin was renamed to $NEW_ADMIN_USERNAME and it's password has been reset to the Default Password")\",
    \"value\": null,
    \"copyable\": false,
    \"qr\": false
}"

if [ "$NEW_ADMIN_USERNAME" == "$CURRENT_ADMIN_USERNAME" ]; then
  # Run the occ command to reset the password
  printf "$OC_PASS\n$OC_PASS\n" | sudo -u www-data -E php $NEXTCLOUD_DIR/occ user:resetpassword $NEW_ADMIN_USERNAME > /dev/null 2>&1
else
  # delete the current admin
  sudo -u www-data -E php $NEXTCLOUD_DIR/occ user:delete $CURRENT_ADMIN_USERNAME > /dev/null 2>&1
  # create the new admin
  printf "$OC_PASS\n$OC_PASS\n" | sudo -u www-data -E php $NEXTCLOUD_DIR/occ user:add -g admin $NEW_ADMIN_USERNAME > /dev/null 2>&1
  sed -i "s/value:\ \"${CURRENT_ADMIN_USERNAME}\"/value:\ \"${NEW_ADMIN_USERNAME}\"/g" /root/start9/stats.yaml
fi

echo $action_result_running
