#!/usr/bin/env bash

set -o errexit

app="/app/frontend"
echo "npm install"
{
    cd "${app}" && npm i bezier-easing
    cd "${app}" && npm install
    cd "${app}" && npm install jszip
    cd "${app}" && npm install file-saver
} || {
    echo "package update broke install, deleting node_modules"
    cd "${app}" && rm -rf node_modules
    cd "${app}" && rm -f package-lock.json
    cd "${app}" && npm install
}
echo "npm update"
cd "${app}" && npm update
echo "npm start"
cd "${app}" && npm run start
