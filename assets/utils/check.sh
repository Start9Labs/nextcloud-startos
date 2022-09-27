#!/bin/bash

check_web(){
    DURATION=$(</dev/stdin)
    if (($DURATION <= 5000 )); then
        exit 60
    else
        curl --silent --fail nextcloud.embassy &>/dev/null
        RES=$?
        if test "$RES" != 0; then
            echo "The Nextcloud UI is unreachable, please wait if initializing" >&2
            exit 61
        fi
    fi
}

case "$1" in
	web)
        check_web
        ;;
    *)
        echo "Usage: $0 [command]"
        echo
        echo "Commands:"
        echo "         web"
esac