FROM node:8.17.0-alpine

ENV TIME_ZONE=Asia/Hong_Kong \
    ENV_NAME=test \
    NODE_ENV=test \
    NODE_CONFIG_ENV=test \
    YARN_VERSION=1.21.1

RUN mkdir /home/app/ \
   && chown -R node:node /home/app

COPY --chown=node:node . /home/app/

RUN apk add --no-cache --virtual .build-deps-yarn curl python make g++ tzdata \
  && curl -fSLO --compressed "https://yarnpkg.com/downloads/$YARN_VERSION/yarn-v$YARN_VERSION.tar.gz" \
  && tar -xzf yarn-v$YARN_VERSION.tar.gz -C /opt/ \
  && ln -snf /opt/yarn-v$YARN_VERSION/bin/yarn /usr/local/bin/yarn \
  && ln -snf /opt/yarn-v$YARN_VERSION/bin/yarnpkg /usr/local/bin/yarnpkg \
  && rm yarn-v$YARN_VERSION.tar.gz \
  && cp /usr/share/zoneinfo/Asia/Hong_Kong /etc/localtime \
  && echo "Asia/Hong_Kong" > /etc/timezone \
  && cd /home/app \
  && yarn install --ignore-engines --network-timeout 1000000 \
  && apk del .build-deps-yarn

USER node

WORKDIR /home/app

CMD ["yarn", "test"]

EXPOSE 3000
