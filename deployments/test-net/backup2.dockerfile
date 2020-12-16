# Base Node
FROM node:12.16.0-alpine AS base
ENV TIME_ZONE=Asia/Hong_Kong \
    ENV_NAME=production \
    NODE_ENV=production \
    NODE_CONFIG_ENV=production
WORKDIR /usr/src/app
COPY . .

# Dependencies
FROM base AS dependencies
RUN mkdir -p /usr/src/app \
  && npm install --production \
  && cp -R node_modules prod_node_modules \
  && npm install typescript@3.9.7 \
  && npx next telemetry disable \
  && npm run build

FROM base AS release
LABEL org.opencontainers.image.source https://github.com/rtang03/fabric-es
RUN mkdir -p /usr/src/app
COPY . .
COPY --from=dependencies /usr/src/app/prod_node_modules ./node_modules
COPY --from=dependencies /usr/src/app/.next ./.next
COPY --from=dependencies /usr/src/app/dist ./dist

CMD [ "npm", "start" ]

EXPOSE 3000
