#!/usr/bin/env bash

set -o errexit

app="/app/backend"
venv="${app}/venv"

if [[ ! -f "${venv}/bin/python" ]]; then
  echo "Creating virtual environement"
  mkdir -p "${venv}"
  python3 -m venv "${venv}"
  pip3 install --upgrade setuptools
fi

echo "Activating environment"
source "${venv}/Scripts/activate"

echo "Installing dependencies"
pip3 install -r "${app}/requirements.txt"

echo "Connecting to database"
python3 "${app}/scripts/wait_for_database.py"

echo "Starting Reset, hope you brought down the docker compose with down -v"
cd "${app}" && rm -rf migrations/versions/*
cd "${app}" && flask db revision --autogenerate -m "baseline"

echo "Upgrading"
cd "${app}" && flask db upgrade head || true

if [[ -n "${ADMIN_PASSWORD}" ]] && [[ -n "${ADMIN_USERNAME}" ]]; then
  python3 "${app}/scripts/create_admin_user.py" \
    --username "${ADMIN_USERNAME}" \
    --password "${ADMIN_PASSWORD}"
fi

echo "Starting flask development server"
cd "${app}" && flask run --host=0.0.0.0 --port=5000

#echo "Applying new migrations"
#cd "${app}" && flask db stamp "8e8f20ebf11d"|| true
#echo "Creating Migration"
#cd "${app}" && flask db downgrade "8e8f20ebf11d" || true
#cd "${app}" && flask db migrate -m "fresh start" || true
#echo "Upgrading"
#cd "${app}" && flask db upgrade head || true
##cd "${app}" && flask db history || true