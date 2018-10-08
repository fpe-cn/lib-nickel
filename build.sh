#!/usr/bin/env bash

if [ "$LAUNCH_BUILD_LIB" = "true" ]
then
    echo "Launch build lib to start webserver"
    gulp build
fi
