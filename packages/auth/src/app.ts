require('dotenv').config();
import http from 'http';
import process from 'process';
import util from 'util';
import Redis from 'ioredis';
import omit from 'lodash/omit';
import 'reflect-metadata';
import stoppable from 'stoppable';
import { ApiKey } from './entity/ApiKey';
import { Client } from './entity/Client';
import { User } from './entity/User';
import { bootstrapAuthServer, createHttpServer, getLogger } from './utils';

const logger = getLogger({ name: '[auth] app.js' });

const port = (process.env.PORT || 8080) as number;
const ENV = {
  TYPEORM_HOST: process.env.TYPEORM_HOST,
  TYPEORM_USERNAME: process.env.TYPEORM_USERNAME,
  TYPEORM_PASSWORD: process.env.TYPEORM_PASSWORD,
  TYPEORM_DATABASE: process.env.TYPEORM_DATABASE,
  TYPEORM_PORT: process.env.TYPEORM_PORT,
  TYPEORM_LOGGING: process.env.TYPEORM_LOGGING,
  TYPEORM_DROPSCHEMA: process.env.TYPEORM_DROPSCHEMA,
  REDIS_HOST: process.env.REDIS_HOST,
  REDIS_PORT: process.env.REDIS_PORT,
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXP_IN_SECOND: process.env.JWT_EXP_IN_SECOND,
  ORG_ADMIN_ID: process.env.ORG_ADMIN_ID,
  ORG_ADMIN_SECRET: process.env.ORG_ADMIN_SECRET,
  ORG_ADMIN_EMAIL: process.env.ORG_ADMIN_EMAIL,
  CLIENT_APPLICATION_NAME: process.env.CLIENT_APPLICATION_NAME,
  CLIENT_SECRET: process.env.CLIENT_SECRET
};
const connection = {
  name: 'default',
  type: 'postgres' as any,
  host: ENV.TYPEORM_HOST || 'localhost',
  port: ENV.TYPEORM_PORT,
  username: ENV.TYPEORM_USERNAME,
  password: ENV.TYPEORM_PASSWORD,
  database: ENV.TYPEORM_DATABASE,
  logging: ENV.TYPEORM_LOGGING === 'true',
  synchronize: true,
  dropSchema: ENV.TYPEORM_DROPSCHEMA === 'true',
  entities: [ApiKey, Client, User]
};

(async () => {
  const timer = new Promise(resolve => {
    setTimeout(() => resolve(true), 15000);
  });
  await timer;

  Object.entries<string>(ENV).forEach(([key, value]) => {
    if (value === undefined) {
      logger.error(`environment variable is missing ${key}`);
      throw new Error(`environment variable is missing ${key}`);
    }
  });

  logger.info(util.format('db connection: %j', omit(connection, 'password', 'entities')));

  let server;
  const redis = new Redis({ port: parseInt(ENV.REDIS_PORT, 10), host: ENV.REDIS_HOST });

  try {
    server = await createHttpServer({
      connection,
      jwtSecret: ENV.JWT_SECRET,
      expiryInSeconds: parseInt(ENV.JWT_EXP_IN_SECOND, 10),
      orgAdminSecret: ENV.ORG_ADMIN_SECRET,
      redis
    });
  } catch (err) {
    logger.error(util.format('An error occurred while createAuthServer: %j', err));
    process.exit(1);
  }

  const stoppableServer = stoppable(http.createServer(server));

  const shutdown = () => {
    stoppableServer.close(err => {
      if (err) {
        logger.error(util.format('An error occurred while closing the server: %j', err));
        process.exitCode = 1;
      } else logger.info('server closes');
    });
    process.exit(0);
  };

  process.on('SIGINT', () => {
    shutdown();
  });

  process.on('SIGTERM', () => {
    shutdown();
  });

  process.on('uncaughtException', err => {
    logger.error('An uncaught error occurred!');
    logger.error(err.stack);
  });

  stoppableServer.listen(port, async () => {
    console.info(`🚀  Auth server started at port: http://0.0.0.0:${port}`);
    logger.info(`🚀  Auth server started at port: http://0.0.0.0:${port}`);

    try {
      await bootstrapAuthServer({
        orgAdminId: ENV.ORG_ADMIN_ID,
        orgAdminSecret: ENV.ORG_ADMIN_SECRET,
        orgAdminEmail: ENV.ORG_ADMIN_EMAIL,
        applicationName: ENV.CLIENT_APPLICATION_NAME,
        clientSecret: ENV.CLIENT_SECRET
      });
    } catch (e) {
      logger.error(util.format('An error occurred while bootstraping auth server: %j', e));
      process.exit(1);
    }

    if (process.send) process.send('ready');
  });
})().catch(error => {
  console.error(error);
  logger.info(util.format('fail to start app.js, %j', error));
  process.exit(1);
});
