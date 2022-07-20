#!/bin/bash

check_api(){
    DURATION=$(</dev/stdin)
    if (($DURATION <= 5000 )); then
        exit 60
    else
        curl --silent --fail nextcloud.embassy &>/dev/null
        RES=$?
        if test "$RES" != 0; then
            echo "Nextcloud Server is installing, this may take a few minutes" >&2
            exit 61
        fi
    fi
}

check_web(){
    DURATION=$(</dev/stdin)
    if (($DURATION <= 5000 )); then
        exit 60
    else
        curl --silent --fail nextcloud.embassy &>/dev/null
        RES=$?
        if test "$RES" != 0; then
            echo "The Nextcloud UI is unreachable" >&2
            exit 1
        fi
    fi
}

case "$1" in
	api)
        check_api
        ;;
	web)
        check_web
        ;;
    *)
        echo "Usage: $0 [command]"
        echo
        echo "Commands:"
        echo "         api"
        echo "         web"
esac