FROM mysql:5.7

RUN apt-get update && apt-get -y install cron

ADD ./mysql/crontab /etc/cron.d/backup-cron

RUN chmod 0644 /etc/cron.d/backup-cron

RUN touch /var/log/cron.log

CMD cron && tail -f /var/log/cron.log