FROM node:12.16.0-alpine

ENV TIME_ZONE=Asia/Hong_Kong \
    ENV_NAME=test \
    NODE_ENV=test \
    NODE_CONFIG_ENV=test \
    TEST_TARGETS="" \
    TEST_OPTIONS=""

RUN mkdir /home/app/ \
   && chown -R node:node /home/app/

COPY --chown=node:node ./build/ /home/app/

COPY ./build/entrypoint.sh /usr/local/bin/

RUN apk add --no-cache curl \
  && apk add --no-cache --virtual .build-deps python make g++ tzdata \
  && cp /usr/share/zoneinfo/Asia/Hong_Kong /etc/localtime \
  && echo "Asia/Hong_Kong" > /etc/timezone \
  && cd /home/app \
  && npm install --production \
  && npm install -g jest \
  && apk del .build-deps

USER node

VOLUME /var/keys/

WORKDIR /home/app

EXPOSE 3000

ENTRYPOINT entrypoint.sh "$TEST_TARGETS" "$TEST_OPTIONS"
