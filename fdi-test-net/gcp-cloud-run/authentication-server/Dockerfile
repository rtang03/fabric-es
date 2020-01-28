FROM node:8.17.0-alpine

ENV TIME_ZONE Asia/Hong_Kong
ENV ENV_NAME production
ENV NODE_ENV production
ENV NODE_CONFIG_ENV production
ENV YARN_VERSION 1.21.1

RUN mkdir /home/node/app/ \
   && chown -R node:node /home/node/app

WORKDIR /home/node/app

COPY --chown=node:node ./*.json ./
COPY --chown=node:node ./packages/authentication/*.json ./packages/authentication/
COPY --chown=node:node ../../../packages/authentication/dist ./packages/authentication/dist
COPY --chown=node:node ../../../packages/authentication/.env.prod ./packages/authentication/.env
COPY --chown=node:node ../../../packages/authentication/public ./packages/authentication/public
COPY --chown=node:node ../../../packages/authentication/views ./packages/authentication/views

RUN apk add --no-cache --virtual .build-deps-yarn curl python make g++ tzdata \
  && curl -fSLO --compressed "https://yarnpkg.com/downloads/$YARN_VERSION/yarn-v$YARN_VERSION.tar.gz" \
  && tar -xzf yarn-v$YARN_VERSION.tar.gz -C /opt/ \
  && ln -snf /opt/yarn-v$YARN_VERSION/bin/yarn /usr/local/bin/yarn \
  && ln -snf /opt/yarn-v$YARN_VERSION/bin/yarnpkg /usr/local/bin/yarnpkg \
  && rm yarn-v$YARN_VERSION.tar.gz \
  && cp /usr/share/zoneinfo/Asia/Hong_Kong /etc/localtime \
  && echo "Asia/Hong_Kong" > /etc/timezone \
  && yarn install --production --ignore-engines --network-timeout 1000000 \
  && apk del .build-deps-yarn

USER node

WORKDIR /home/node/app/packages/authentication

CMD [ "node", "./dist/app.js"]

EXPOSE 8080
