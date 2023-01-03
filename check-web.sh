#!/bin/bash

DURATION=$(</dev/stdin)
if (($DURATION <= 5000)); then
    exit 60
else
    if ! [ -e "/re.start" ]; then 
        echo "Nextcloud is initializing" >&2
        exit 61
    elif ! curl --silent --fail nextcloud.embassy &>/dev/null; then
        echo "Web interface is unreachable" >&2
        exit 1
    fi
fi
