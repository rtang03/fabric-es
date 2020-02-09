FROM node:8.17.0-alpine

ENV TIME_ZONE=Asia/Hong_Kong \
    ENV_NAME=production \
    NODE_ENV=production \
    NODE_CONFIG_ENV=production \
    YARN_VERSION=1.21.1

RUN mkdir /home/node/app/ \
   && chown -R node:node /home/node/app

COPY --chown=node:node ./.build /home/node/app/

RUN apk add --no-cache --virtual .build-deps-yarn curl python make g++ tzdata \
  && curl -fSLO --compressed "https://yarnpkg.com/downloads/$YARN_VERSION/yarn-v$YARN_VERSION.tar.gz" \
  && tar -xzf yarn-v$YARN_VERSION.tar.gz -C /opt/ \
  && ln -snf /opt/yarn-v$YARN_VERSION/bin/yarn /usr/local/bin/yarn \
  && ln -snf /opt/yarn-v$YARN_VERSION/bin/yarnpkg /usr/local/bin/yarnpkg \
  && rm yarn-v$YARN_VERSION.tar.gz \
  && cp /usr/share/zoneinfo/Asia/Hong_Kong /etc/localtime \
  && echo "Asia/Hong_Kong" > /etc/timezone \
  && cd /home/node/app \
  && yarn install --production --ignore-engines --network-timeout 1000000 \
  && yarn global add pm2 pm2-logrotate \
  && pm2 install pm2-logrotate \
  && apk del .build-deps-yarn

USER node

WORKDIR /home/node/app/packages/authentication

CMD [ "pm2-runtime", "processes.yaml"]

EXPOSE 8080
