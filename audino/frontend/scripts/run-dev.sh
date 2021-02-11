#!/usr/bin/env bash

set -o errexit

app="/app/frontend"
echo "npm install"
cd "${app}" && npm install
echo "npm supervisor"
cd "${app}" && npm install supervisor -g --experimental-modules
#cd "${app}" && npm run supervisor src/app.js
echo "npm start"
cd "${app}" && npm run start && npm run supervisor src/app.js
