#!/usr/bin/env bash

set -o errexit

app="/app/frontend"
echo "npm install"
cd "${app}" && npm install --save @fortawesome/fontawesome-free
{
    cd "${app}" && npm install
} || {
    echo "package update broke install, deleting node_modules"
    cd "${app}" && rm -rf node_modules
    cd "${app}" && rm -f package-lock.json
    cd "${app}" && npm install
}
echo "npm start"
cd "${app}" && npm run start
