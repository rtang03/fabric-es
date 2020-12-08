require('dotenv').config();

import http from 'http';
import process from 'process';
import util from 'util';
import terminus from '@godaddy/terminus';
import Redis from 'ioredis';
import omit from 'lodash/omit';
import pg from 'pg';
import { ApiKey } from './entity/ApiKey';
import { Client } from './entity/Client';
import { User } from './entity/User';
import { bootstrapAuthServer, createHttpServer, getLogger } from './utils';

const logger = getLogger({ name: '[auth] app.js' });
const port = (process.env.PORT || 8080) as number;
const ENV = {
  CLIENT_APPLICATION_NAME: process.env.CLIENT_APPLICATION_NAME,
  CLIENT_SECRET: process.env.CLIENT_SECRET,
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXP_IN_SECOND: process.env.JWT_EXP_IN_SECOND,
  ORG_ADMIN_EMAIL: process.env.ORG_ADMIN_EMAIL,
  ORG_ADMIN_ID: process.env.ORG_ADMIN_ID,
  ORG_ADMIN_SECRET: process.env.ORG_ADMIN_SECRET,
  REFRESH_TOKEN_EXP_IN_SEC: process.env.REFRESH_TOKEN_EXP_IN_SEC,
  REDIS_HOST: process.env.REDIS_HOST,
  REDIS_PORT: process.env.REDIS_PORT,
  TYPEORM_HOST: process.env.TYPEORM_HOST,
  TYPEORM_USERNAME: process.env.TYPEORM_USERNAME,
  TYPEORM_PASSWORD: process.env.TYPEORM_PASSWORD,
  TYPEORM_DATABASE: process.env.TYPEORM_DATABASE,
  TYPEORM_PORT: process.env.TYPEORM_PORT,
  TYPEORM_LOGGING: process.env.TYPEORM_LOGGING,
};
// see https://github.com/typeorm/typeorm/blob/master/docs/connection-options.md
const connection = {
  name: 'default',
  type: 'postgres' as any,
  host: ENV.TYPEORM_HOST || 'localhost',
  port: ENV.TYPEORM_PORT,
  username: ENV.TYPEORM_USERNAME,
  password: ENV.TYPEORM_PASSWORD,
  database: ENV.TYPEORM_DATABASE,
  logging: ENV.TYPEORM_LOGGING === 'true',
  synchronize: false,
  dropSchema: false,
  entities: [Client, User, ApiKey],
  connectTimeoutMS: 10000,
};

(async () => {
  let server;
  logger.info('========Starting Auth Server ========');
  logger.debug(
    util.format('attempt to connect psql: %j', omit(connection, 'password', 'entities'))
  );

  // ensuring not missing key
  Object.entries<string>(ENV).forEach(([key, value]) => {
    if (value === undefined) {
      logger.error(`environment variable is missing ${key}`);
      throw new Error(`environment variable is missing ${key}`);
    }
  });

  // Redis
  const redis = new Redis({ port: parseInt(ENV.REDIS_PORT, 10), host: ENV.REDIS_HOST });
  redis.on('connect', () => logger.info('🔅  redis connected'));

  // psql
  const psql = new pg.Client({
    user: connection.username,
    host: connection.host,
    database: connection.database,
    password: connection.password,
    port: Number(connection.port),
  });
  await psql.connect();
  logger.info('🔅  psql connected');

  // safety measure: catch all uncaughtException
  process.on('uncaughtException', (err) => {
    logger.error('An uncaught error occurred!');
    logger.error(err.stack);
  });

  try {
    server = await createHttpServer({
      connection,
      jwtSecret: ENV.JWT_SECRET,
      jwtExpiryInSec: parseInt(ENV.JWT_EXP_IN_SECOND, 10),
      refTokenExpiryInSec: parseInt(ENV.REFRESH_TOKEN_EXP_IN_SEC, 10),
      orgAdminSecret: ENV.ORG_ADMIN_SECRET,
      redis,
    });
  } catch (err) {
    logger.error(util.format('❌  An error occurred while createAuthServer: %j', err));
    process.exit(1);
  }

  const onHealthCheck = async () => {
    const response: any = {
      uptime: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
    };

    try {
      await psql.query('SELECT 1');
      response.psql = 'ready';
    } catch (err) {
      response.psql = 'failed';
    }

    response.redis = redis.status;

    return response.psql === 'ready' && response.redis === 'ready'
      ? Promise.resolve(response)
      : Promise.reject(new Error('not ready'));
  };

  // SIGINT
  const onSignal = () =>
    Promise.all([
      psql
        .end()
        .then(() => logger.info('🚫  psql disconnected'))
        .catch((err) => logger.error('❌  error during disconnection', err.stack)),
      redis
        .quit()
        .then(() => logger.info('🚫  redis disconnected'))
        .catch((err) => logger.error('❌  error during disconnection', err.stack)),
    ]);

  // Required for k8s : given your readiness probes run every 5 second
  // may be worth using a bigger number so you won't run into any race conditions
  const beforeShutdown = () => new Promise((resolve) => {
    logger.info('cleanup finished, gateway is shutting down');
    setTimeout(resolve, 5000);
  });

  terminus
    .createTerminus(http.createServer(server), {
      timeout: 3000,
      logger: console.log,
      signals: ['SIGINT', 'SIGTERM'],
      healthChecks: {
        '/healthcheck': onHealthCheck,
      },
      onSignal,
      beforeShutdown
    })
    .listen(port, '0.0.0.0', async () => {
      logger.info(`🚀  Auth server started at port: http://0.0.0.0:${port}`);

      try {
        await bootstrapAuthServer({
          orgAdminId: ENV.ORG_ADMIN_ID,
          orgAdminSecret: ENV.ORG_ADMIN_SECRET,
          orgAdminEmail: ENV.ORG_ADMIN_EMAIL,
          applicationName: ENV.CLIENT_APPLICATION_NAME,
          clientSecret: ENV.CLIENT_SECRET,
        });
      } catch (e) {
        logger.error(util.format('❌  An error occurred while bootstraping auth server: %j', e));
        process.exit(1);
      }
    });
})().catch((error) => {
  logger.error(util.format('❌  fail to start app.js, %j', error));
  process.exit(1);
});
