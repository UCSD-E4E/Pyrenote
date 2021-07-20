FROM node:13.12.0-alpine

WORKDIR /app/frontend

COPY . /app/frontend

RUN npm install -g npm@6.14.4
RUN npm install

#RUN npm run build
#
#RUN ls /app/frontend/build/static/js/

ADD ./test.sh /

RUN chmod +x /test.sh

COPY test.sh /usr/local/bin/

ENTRYPOINT ["/test.sh"]
