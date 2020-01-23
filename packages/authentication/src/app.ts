import { config } from 'dotenv';
config({ path: './env' });

import http from 'http';
import omit from 'lodash/omit';
import process from 'process';
import 'reflect-metadata';
import stoppable from 'stoppable';
import util from 'util';
import { createAuthServer, createDbConnection } from '.';
import { createRootClient, getLogger } from './utils';

const host = process.env.TYPEORM_HOST || 'localhost';

const postgres: any = createDbConnection({
  name: 'default',
  type: 'postgres' as any,
  host,
  port: process.env.TYPEORM_HOST === 'localhost' ? 5432 : undefined,
  username: process.env.TYPEORM_USERNAME || 'postgres',
  password: process.env.TYPEORM_PASSWORD || 'docker',
  database: process.env.TYPEORM_DATABASE,
  logging: process.env.TYPEORM_LOGGING,
  dropSchema: process.env.TYPEORM_DROPSCHEMA,
  synchronize: true
});

if (process.env.CLOUD_POSTGRES_CONNECTION) {
  postgres.port = undefined;
  postgres.host = '/cloudsql/' + process.env.CLOUD_POSTGRES_CONNECTION;
}

// the column type of entities requires refactoring
const mysql: any = createDbConnection({
  name: 'default',
  type: 'mysql' as any,
  host,
  port: process.env.TYPEORM_HOST === 'localhost' ? 3306 : undefined,
  username: process.env.TYPEORM_USERNAME || 'root',
  password: process.env.TYPEORM_PASSWORD || 'docker',
  database: process.env.TYPEORM_DATABASE,
  logging: process.env.TYPEORM_LOGGING,
  dropSchema: process.env.TYPEORM_DROPSCHEMA,
  synchronize: true
});

if (process.env.CLOUD_MYSQL_CONNECTION_NAME) {
  mysql.extra = {
    socketPath: '/cloudsql/' + process.env.CLOUD_MYSQL_CONNECTION
  };
  mysql.port = undefined;
  mysql.host = undefined;
}

// the column type of entities requires refactoring
const sqlite3: any = createDbConnection({
  name: 'default',
  type: 'sqlite' as any,
  database: process.env.TYPEORM_DATABASE,
  logging: true,
  synchronize: true,
  dropSchema: true
});

const dbConnection = { mysql, postgres, sqlite3 }[process.env.DATABASE_TYPE];
const app: any = {};
const port = (process.env.PORT || 8080) as number;
const uri = `http://localhost:${port}/graphql`;

(async () => {
  const logger = getLogger('app.js');
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

  logger.info(
    util.format('db connection: %j', omit(mysql, 'password', 'entities'))
  );

  const server = await createAuthServer({
    dbConnection,
    rootAdminPassword: process.env.ROOT_PASSWORD || 'admin_test',
    rootAdmin: process.env.ROOT || 'admin',
    accessTokenSecret: process.env.ACCESS_TOKEN_SECRET,
    refreshTokenSecret: process.env.REFRESH_TOKEN_SECRET
  });

  const stoppableServer = stoppable(http.createServer(server));

  app.shutdown = () => {
    stoppableServer.close(err => {
      if (err) {
        logger.error(
          util.format('An error occurred while closing the server: %j', err)
        );
        process.exitCode = 1;
      } else logger.info('server closes');
    });
    process.exit();
  };

  process.on('SIGINT', () => {
    app.shutdown();
  });

  process.on('SIGTERM', () => {
    app.shutdown();
  });

  stoppableServer.listen(port, '0.0.0.0', async () => {
    console.info(`🚀  Auth server started at port: http://localhost:${port}`);
    logger.info(`🚀  Auth server started at port: http://localhost:${port}`);

    await createRootClient({
      uri,
      admin_password: process.env.ROOT_PASSWORD || 'admin_test',
      admin: process.env.ROOT || 'admin'
    });
  });
})().catch(error => {
  console.error(error);
  process.exit();
});
