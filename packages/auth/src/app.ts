require('dotenv').config();
import http from 'http';
import process from 'process';
import util from 'util';
import Redis from 'ioredis';
import omit from 'lodash/omit';
import 'reflect-metadata';
import stoppable from 'stoppable';
import { Client } from './entity/Client';
import { User } from './entity/User';
import { bootstrapAuthServer, createHttpServer, getLogger } from './utils';

const logger = getLogger({ name: '[auth] app.js' });

const connection = {
  name: 'default',
  type: 'postgres' as any,
  host: process.env.TYPEORM_HOST || 'localhost',
  port: process.env.TYPEORM_PORT,
  username: process.env.TYPEORM_USERNAME,
  password: process.env.TYPEORM_PASSWORD,
  database: process.env.TYPEORM_DATABASE,
  logging: process.env.TYPEORM_LOGGING === 'true',
  synchronize: true,
  dropSchema: process.env.TYPEORM_DROPSCHEMA === 'true',
  entities: [Client, User]
};

// use GCP SQL
// if (process.env.CLOUD_POSTGRES_CONNECTION) {
//   connection.port = undefined;
//   connection.host = '/cloudsql/' + process.env.CLOUD_POSTGRES_CONNECTION;
// }

const port = (process.env.PORT || 8080) as number;

(async () => {
  const timer = new Promise(resolve => {
    setTimeout(() => resolve(true), 15000);
  });
  await timer;

  if (!process.env.TYPEORM_USERNAME) {
    logger.error('missing username');
    throw new Error('missing username');
  }

  if (!process.env.TYPEORM_PASSWORD) {
    logger.error('missing password');
    throw new Error('missing password');
  }

  if (!process.env.TYPEORM_DATABASE) {
    logger.error('missing database name');
    throw new Error('missing database name');
  }

  logger.info(util.format('db connection: %j', omit(connection, 'password', 'entities')));

  let server;
  const redis = new Redis({ port: parseInt(process.env.REDIS_PORT, 10), host: process.env.REDIS_HOST });

  try {
    server = await createHttpServer({
      connection,
      jwtSecret: process.env.JWT_SECRET,
      expiryInSeconds: parseInt(process.env.JWT_EXP_IN_SECOND, 10),
      orgAdminSecret: process.env.ORG_ADMIN_SECRET,
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
        orgAdminId: process.env.ORG_ADMIN_ID,
        orgAdminSecret: process.env.ORG_ADMIN_SECRET,
        orgAdminEmail: process.env.ORG_ADMIN_EMAIL,
        applicationName: process.env.CLIENT_APPLICATION_NAME,
        clientSecret: process.env.CLIENT_SECRET
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
