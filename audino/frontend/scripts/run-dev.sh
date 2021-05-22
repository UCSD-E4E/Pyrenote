#!/usr/bin/env bash

set -o errexit

app="/app/frontend"
echo "npm install"
cd "${app}" && npm install
echo "npm start"
cd "${app}" && npm run start
