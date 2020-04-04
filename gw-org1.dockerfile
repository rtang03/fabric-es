FROM node:10.19.0-alpine

ENV TIME_ZONE=Asia/Hong_Kong \
    ENV_NAME=production \
    NODE_ENV=production \
    NODE_CONFIG_ENV=production \
    YARN_VERSION=1.21.1

RUN mkdir /home/app/ \
   && chown -R node:node /home/app

COPY --chown=node:node ./.build /home/app/

COPY ./.build/entrypoint.sh /usr/local/bin/

RUN apk add --no-cache --virtual .build-deps-yarn curl python make g++ tzdata \
  && curl -fSLO --compressed "https://yarnpkg.com/downloads/$YARN_VERSION/yarn-v$YARN_VERSION.tar.gz" \
  && tar -xzf yarn-v$YARN_VERSION.tar.gz -C /opt/ \
  && ln -snf /opt/yarn-v$YARN_VERSION/bin/yarn /usr/local/bin/yarn \
  && ln -snf /opt/yarn-v$YARN_VERSION/bin/yarnpkg /usr/local/bin/yarnpkg \
  && rm yarn-v$YARN_VERSION.tar.gz \
  && cp /usr/share/zoneinfo/Asia/Hong_Kong /etc/localtime \
  && echo "Asia/Hong_Kong" > /etc/timezone \
  && cd /home/app \
  && yarn install --production --ignore-engines --network-timeout 1000000 \
  && yarn global add pm2 \
  && apk del .build-deps-yarn

USER node

VOLUME /home/app/packages/gw-org1/assets /home/app/packages/gw-org2/connection /home/app/packages/gw-org1/logs /var/artifacts/crypto-config

WORKDIR /home/app/packages/gw-org1

EXPOSE 4001

ENTRYPOINT ["entrypoint.sh"]

CMD ["gateway", "admin user loan document pDocContents rLoanDetails"]
