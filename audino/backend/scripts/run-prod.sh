#!/usr/bin/env sh

set -o errexit

uwsgi="/app/"
app="/app/backend"

echo "Connecting to database"
python3 "${app}/scripts/wait_for_database.py"

echo "Applying new migrations"
[ ! -d "${app}/migrations/versions/" ] && mkdir "${app}/migrations/versions/"
cd "${app}" && flask db migrate || true
cd "${app}" && flask db upgrade || true

if [[ -n "${ADMIN_PASSWORD}" ]] && [[ -n "${ADMIN_USERNAME}" ]]; then
  python3 "${app}/scripts/create_admin_user.py" \
    --username "${ADMIN_USERNAME}" \
    --password "${ADMIN_PASSWORD}"
fi

echo "Starting flask production server"
cd "${uwsgi}" && uwsgi --ini uwsgi.ini
