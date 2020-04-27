FROM node:10.19.0-alpine

ENV TIME_ZONE=Asia/Hong_Kong \
    ENV_NAME=production \
    NODE_ENV=production \
    NODE_CONFIG_ENV=production

RUN mkdir /home/app/ \
   && chown -R node:node /home/app/

COPY --chown=node:node ./build/ /home/app/

RUN cd /home/app/ \
 && npm install --production --ignore-engines

USER node

WORKDIR /home/app/

EXPOSE 8080

CMD [ "npm", "start"]
