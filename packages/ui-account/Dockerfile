FROM node:10.19.0-alpine

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

COPY package.json ./
RUN npm install

COPY . .
RUN npm run build

ENTRYPOINT [ "npm", "run"]
CMD [ "start" ]

EXPOSE 3000
