#!/bin/bash 

set -e

# Define the path to the Nextcloud installation
NEXTCLOUD_DIR="/var/www/html"

action_result_running="    {
    \"version\": \"0\",
    \"message\": \"Success!  You may now use the NCDownloader app. \",
    \"value\": null,
    \"copyable\": false,
    \"qr\": false
}"

# Run the occ command to disable Maintenance Mode in case it gets hung
sudo apk add aria2 python3 > /dev/null 2>&1
sudo curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp
sudo chmod a+rx /usr/local/bin/yt-dlp

echo $action_result_running
