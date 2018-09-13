#!/usr/bin/env bash

echo "Build in '$LAUNCH_BUILD_LIB' mode"
if [ "$LAUNCH_BUILD_LIB" = "true" ]
then
    gulp build
fi
