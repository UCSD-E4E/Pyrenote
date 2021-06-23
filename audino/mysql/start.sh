#!/usr/bin/env bash

apt-get update && apt-get -y install cron

cp ./mysql/crontab /etc/cron.d/backup-cron

cp ./mysql/start.sh /
cp ./mysql/docker-entrypoint.sh /

chmod +x /start.sh
chmod +x /start.sh

chmod 0644 /etc/cron.d/backup-cron

crontab /etc/cron.d/backup-cron

touch /var/log/cron.log


chown -R mysql:mysql /var/lib/mysql /var/run/mysqld
bash /docker-entrypoint.sh
echo "++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++"
mysqld --user=root --init-file=/mysql/create_database.sql --character-set-server=utf8mb4 --collation-server=utf8mb4_bin
