#!/bin/bash
set -e

cp /usr/src/nextcloud/config/*.php /var/www/html/config/

php /var/www/html/occ db:add-missing-indices

# Disable apps that aren't enabled by default
declare -A default_map
default_apps=('activity' 'admin_audit' 'app_api' 'bruteforcesettings' 'calendar' 'circles' 'cloud_federation_api' 'comments' 'contacts' 'contactsinteraction' 'dashboard' 'dav' 'encryption' 'federatedfilesharing' 'federation' 'files' 'files_downloadlimit' 'files_external' 'files_pdfviewer' 'files_reminders' 'files_sharing' 'files_trashbin' 'files_versions' 'firstrunwizard' 'logreader' 'lookup_server_connector' 'nextcloud_announcements' 'notifications' 'oauth2' 'password_policy' 'photos' 'privacy' 'profile' 'provisioning_api' 'recommendations' 'related_resources' 'serverinfo' 'settings' 'sharebymail' 'support' 'survey_client' 'suspicious_login' 'systemtags' 'text' 'theming' 'twofactor_backupcodes' 'twofactor_nextcloud_notification' 'twofactor_totp' 'updatenotification' 'user_ldap' 'user_status' 'viewer' 'weather_status' 'webhook_listeners' 'workflowengine')

for app in "${default_apps[@]}"; do
  default_map["$app"]=1
done

enabled_apps=($(php /var/www/html/occ app:list | \
awk '/^Enabled:/ {f=1; next} /^Disabled:/ {f=0} f && /^[[:space:]]+-/ {sub(/:$/, "", $2); print $2}'))

declare -a disabled_map

echo 'Disabling non-default apps'
for enabled_app in "${enabled_apps[@]}"; do
  if [[ -z "${default_map[$enabled_app]}" ]]; then
    echo "Disabling non-default app: $enabled_app"
    disabled_map+=($enabled_app)
    php /var/www/html/occ app:disable $enabled_app
  fi
done

echo 'Re-enabling non-default apps'
for disabled_app in "${disabled_map[@]}"; do
  echo "Re-enabling $disabled_app"
  php /var/www/html/occ app:enable $disabled_app
done

if [[ " ${enabled_apps[@]} " =~ [[:space:]]memories[[:space:]] ]]; then
    echo "setting memories exif binary"
    php /var/www/html/occ config:system:delete memories.exiftool
    php /var/www/html/occ config:system:delete memories.vod.path
fi

php /var/www/html/occ maintenance:repair --include-expensive


mkdir -p /root/migrations
touch /root/migrations/$NEXTCLOUD_VERSION.complete
touch /root/migrations/$(echo "$NEXTCLOUD_VERSION" | sed 's/\..*//g').complete
