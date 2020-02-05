FROM node:8.17.0-alpine

ENV TIME_ZONE=Asia/Hong_Kong \
    ENV_NAME=production \
    NODE_ENV=production \
    NODE_CONFIG_ENV=production \
    YARN_VERSION=1.21.1

RUN mkdir /home/node/app/ \
   && chown -R node:node /home/node/app

COPY --chown=node:node ./.build /home/node/app/

#COPY --chown=node:node ./*.json ./yarn.lock /home/node/app/
#COPY --chown=node:node ./packages/authentication/*.json ./packages/authentication/.env.prod /home/node/app/packages/authentication/
#COPY --chown=node:node ./packages/authentication/dist/ /home/node/app/packages/authentication/dist/
#COPY --chown=node:node ./packages/authentication/public/ /home/node/app/packages/authentication/public/
#COPY --chown=node:node ./packages/authentication/views/ /home/node/app/packages/authentication/views/
#COPY --chown=node:node ./packages/fabric-cqrs/*.json /home/node/app/packages/fabric-cqrs/
#COPY --chown=node:node ./packages/fabric-cqrs/dist /home/node/app/packages/fabric-cqrs/
#COPY --chown=node:node ./packages/gw-node/*.json /home/node/app/packages/gw-node/
#COPY --chown=node:node ./packages/gw-node/dist /home/node/app/packages/gw-node/
#COPY --chown=node:node ./packages/operator/*.json /home/node/app/packages/operator/
#COPY --chown=node:node ./packages/operator/dist /home/node/app/packages/operator/
#COPY --chown=node:node ./packages/model-common/*.json /home/node/app/packages/model-common/
#COPY --chown=node:node ./packages/model-common/dist /home/node/app/packages/model-common/
#COPY --chown=node:node ./packages/model-loan/*.json /home/node/app/packages/model-loan/
#COPY --chown=node:node ./packages/model-loan/dist /home/node/app/packages/model-loan/
#COPY --chown=node:node ./packages/model-loan-private/*.json /home/node/app/packages/model-loan-private/
#COPY --chown=node:node ./packages/model-loan-private/dist /home/node/app/packages/model-loan-private/
#COPY --chown=node:node ./packages/gw-org1/*.json /home/node/app/packages/gw-org1/
#COPY --chown=node:node ./packages/gw-org1/dist /home/node/app/packages/gw-org1/

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
  && apk del .build-deps-yarn \
  && mv /home/node/app/packages/gw-org1/.env.prod /home/node/app/packages/gw-org1/.env \
  && env \
  && ln -s /home/node/app/packages/gw-org1/assets /var/assets \
  && ln -s /home/node/app/packages/gw-org1/connection /var/connection \
  && touch / /home/node/app/packages/gw-org1/connection/connection.yaml \
  && ls -la /var \
  && ls -la /var/connection

USER node

WORKDIR /home/node/app/packages/gw-org1

#CMD ["sh" , "-c" , "./run.sh"]

EXPOSE 4001
