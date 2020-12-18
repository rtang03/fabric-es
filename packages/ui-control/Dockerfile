FROM node:12.16.0-alpine
LABEL org.opencontainers.image.source https://github.com/rtang03/fabric-es
ENV TIME_ZONE=Asia/Hong_Kong \
    ENV_NAME=production \
    NODE_ENV=production \
    NODE_CONFIG_ENV=production

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

COPY . .

RUN npm install --production \
  && npx next telemetry disable \
  && npm run build \
  && npm uninstall typescript rimraf

CMD [ "npm", "start" ]

EXPOSE 3000
