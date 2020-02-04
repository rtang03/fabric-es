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
COPY --chown=node:node ./packages/fabric-cqrs/*.json ./packages/fabric-cqrs/
COPY --chown=node:node ./packages/fabric-cqrs/dist ./packages/fabric-cqrs/
COPY --chown=node:node ./packages/gw-node/*.json ./packages/gw-node/
COPY --chown=node:node ./packages/gw-node/dist ./packages/gw-node/
COPY --chown=node:node ./packages/operator/*.json ./packages/operator/
COPY --chown=node:node ./packages/operator/dist ./packages/operator/
COPY --chown=node:node ./packages/model-common/*.json ./packages/model-common/
COPY --chown=node:node ./packages/model-common/dist ./packages/model-common/
COPY --chown=node:node ./packages/model-loan/*.json ./packages/model-loan/
COPY --chown=node:node ./packages/model-loan/dist ./packages/model-loan/
COPY --chown=node:node ./packages/model-loan-private/*.json ./packages/model-loan-private/
COPY --chown=node:node ./packages/model-loan-private/dist ./packages/model-loan-private/
COPY --chown=node:node ./packages/gw-org1/*.json ./packages/gw-org1/
COPY --chown=node:node ./packages/gw-org1/dist ./packages/gw-org1/
COPY --chown=node:node ./packages/gw-org1/.env.prod ./packages/gw-org1/.env
COPY --chown=node:node deployments/gw-org-dev-net/build-artifacts/run.sh ./packages/gw-org1/

WORKDIR /home/node/app/packages/gw-org1

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
  && ln -s /home/node/app/packages/gw-org1/assets /var/org1/assets \
  && ln -s /home/node/app/packages/gw-org1/connection /var/org1/connection

USER node

CMD ["sh" , "-c" , "./run.sh"]

EXPOSE 4001
