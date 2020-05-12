FROM node:10.19.0-alpine

ENV TIME_ZONE=Asia/Hong_Kong \
    ENV_NAME=production \
    NODE_ENV=production \
    NODE_CONFIG_ENV=production

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

COPY . .

RUN npm install --production \
  && npx next telemetry disable \
  && npm run build

CMD [ "npm", "start" ]

EXPOSE 3000
