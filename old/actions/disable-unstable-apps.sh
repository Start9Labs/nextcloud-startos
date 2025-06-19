#!/bin/bash 

set -e

# Define the path to the Nextcloud installation
NEXTCLOUD_DIR="/var/www/html"

declare -A default_map
default_apps=('activity' 'calendar' 'circles' 'cloud_federation_api' 'comments' 'contacts' 'contactsinteraction' 'dashboard' 'dav' 'federatedfilesharing' 'federation' 'files' 'files_downloadlimit' 'files_pdfviewer' 'files_reminders' 'files_sharing' 'files_trashbin' 'files_versions' 'firstrunwizard' 'logreader' 'lookup_server_connector' 'nextcloud_announcements' 'notifications' 'oauth2' 'password_policy' 'photos' 'privacy' 'provisioning_api' 'recommendations' 'related_resources' 'serverinfo' 'settings' 'sharebymail' 'support' 'survey_client' 'systemtags' 'text' 'theming' 'twofactor_backupcodes' 'updatenotification' 'user_status' 'viewer' 'weather_status' 'workflowengine')

for app in "${default_apps[@]}"; do
  default_map["$app"]=1
done

enabled_apps=($(sudo -u www-data -E php $NEXTCLOUD_DIR/occ app:list | \
awk '/^Enabled:/ {f=1; next} /^Disabled:/ {f=0} f && /^[[:space:]]+-/ {sub(/:$/, "", $2); print $2}'))

declare -a disabled_apps

for enabled_app in "${enabled_apps[@]}"; do
  if [[ -z "${default_map[$enabled_app]}" ]]; then
    disabled_apps+=($enabled_app)
    sudo -u www-data -E php $NEXTCLOUD_DIR/occ app:disable $enabled_app >&2
  fi
done

action_result="    {
    \"version\": \"0\",
    \"message\": \"Success! All Non-default apps have been disabled. Your Nextcloud UI should now be accessible. Disabled Apps: ${disabled_apps[*]}\",
    \"value\": null,
    \"copyable\": false,
    \"qr\": false
}"

echo $action_result
