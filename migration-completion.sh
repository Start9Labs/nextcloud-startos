#!/bin/bash
set -e

cp /usr/src/nextcloud/config/*.php /var/www/html/config/

php /var/www/html/occ db:add-missing-indices

php /var/www/html/occ maintenance:repair --include-expensive

# Disable apps that aren't enabled by default
declare -A default_map
default_apps=('activity' 'calendar' 'circles' 'cloud_federation_api' 'comments' 'contacts' 'contactsinteraction' 'dashboard' 'dav' 'federatedfilesharing' 'federation' 'files' 'files_pdfviewer' 'files_reminders' 'files_rightclick' 'files_sharing' 'files_trashbin' 'files_versions' 'firstrunwizard' 'logreader' 'lookup_server_connector' 'nextcloud_announcements' 'notifications' 'oauth2' 'password_policy' 'photos' 'privacy' 'provisioning_api' 'recommendations' 'related_resources' 'serverinfo' 'settings' 'sharebymail' 'support' 'survey_client' 'systemtags' 'text' 'theming' 'twofactor_backupcodes' 'updatenotification' 'user_status' 'viewer' 'weather_status' 'workflowengine')

for app in "${default_apps[@]}"; do
  default_map["$app"]=1
done

enabled_apps=($(php /var/www/html/occ app:list | \
awk '/^Enabled:/ {f=1; next} /^Disabled:/ {f=0} f && /^[[:space:]]+-/ {sub(/:$/, "", $2); print $2}'))

for enabled_app in "${enabled_apps[@]}"; do
  if [[ -z "${default_map[$enabled_app]}" ]]; then
    echo "Disabling non-default app: $enabled_app"
    php /var/www/html/occ app:disable $enabled_app
  fi
done

mkdir -p /root/migrations
touch /root/migrations/$NEXTCLOUD_VERSION.complete
touch /root/migrations/$(echo "$NEXTCLOUD_VERSION" | sed 's/\..*//g').complete
