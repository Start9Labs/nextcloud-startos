#!/bin/bash

DURATION=$(</dev/stdin)
if (($DURATION <= 5000)); then
    exit 60
else
    if ! [ -f "/run/nextcloud.pid" ]; then 
        echo "Nextcloud is initializing" >&2
        exit 61
    elif ! [ -f "/root/migrations/$NEXTCLOUD_VERSION.complete" ]; then
        echo "Nextcloud is updating..." >&2
        exit 61
    elif ! curl --silent --fail -L nextcloud.embassy &>/dev/null; then
        echo "Web interface is unreachable" >&2
        exit 1
    fi
fi
