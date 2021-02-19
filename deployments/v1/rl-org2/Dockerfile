FROM node:12.16.0-alpine

ENV TIME_ZONE=Asia/Hong_Kong \
    ENV_NAME=production \
    NODE_ENV=production \
    NODE_CONFIG_ENV=production

RUN mkdir /home/app/ \
   && chown -R node:node /home/app/

COPY --chown=node:node ./build/ /home/app/

COPY package.json /home/app/

RUN cd /home/app/ \
 && npm install --production --ignore-engines

USER node

VOLUME /key/

WORKDIR /home/app/

# Port 4001 should be removed when mock server is no longer needed
EXPOSE 3000 4001

ENTRYPOINT ["node"]
CMD ["dist/relay.js", "https"]
