require('dotenv').config({ path: './.env' });
import http from 'http';
import process from 'process';
import util from 'util';
import omit from 'lodash/omit';
import 'reflect-metadata';
import stoppable from 'stoppable';
import { createRootClient, getLogger } from './utils';
import { createAuthServer, createDbConnection } from '.';

const host = process.env.TYPEORM_HOST || 'localhost';
const logger = getLogger({ name: 'app.js' });

const postgres: any = createDbConnection({
  name: 'default',
  type: 'postgres' as any,
  host,
  port: process.env.TYPEORM_PORT,
  username: process.env.TYPEORM_USERNAME, // 'postgres',
  password: process.env.TYPEORM_PASSWORD, // 'docker',
  database: process.env.TYPEORM_DATABASE,
  logging: process.env.TYPEORM_LOGGING === 'true',
  dropSchema: process.env.TYPEORM_DROPSCHEMA === 'true',
  synchronize: true
});

if (process.env.CLOUD_POSTGRES_CONNECTION) {
  postgres.port = undefined;
  postgres.host = '/cloudsql/' + process.env.CLOUD_POSTGRES_CONNECTION;
}

const dbConnection = postgres;
const port = (process.env.PORT || 8080) as number;
const uri = `http://localhost:${port}/graphql`;

(async () => {
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

  logger.info(util.format('db connection: %j', omit(dbConnection, 'password', 'entities')));

  let server;

  try {
    server = await createAuthServer({
      dbConnection,
      rootAdminPassword: process.env.ROOT_ADMIN_PASSWORD,
      rootAdmin: process.env.ROOT_ADMIN,
      accessTokenSecret: process.env.ACCESS_TOKEN_SECRET,
      refreshTokenSecret: process.env.REFRESH_TOKEN_SECRET
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

  stoppableServer.listen(port, '0.0.0.0', async () => {
    console.info(`🚀  Auth server started at port: http://localhost:${port}`);
    logger.info(`🚀  Auth server started at port: http://localhost:${port}`);

    try {
      await createRootClient({
        uri,
        admin_password: process.env.ROOT_ADMIN_PASSWORD,
        admin: process.env.ROOT_ADMIN
      });
    } catch (err) {
      logger.error(util.format('An error occurred while createRootClient: %j', err));
      process.exit(1);
    }
    process.send('ready');
  });
})().catch(error => {
  console.error(error);
  logger.info(util.format('fail to start app.js, %j', error));
  process.exit(1);
});
