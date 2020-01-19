import { config } from 'dotenv';
config({ path: './env' });

import http from 'http';
import omit from 'lodash/omit';
import process from 'process';
import stoppable from 'stoppable';
import util from 'util';
import { createAuthServer, createDbConnection } from '.';
import { createRootClient, getLogger } from './utils';

const host = process.env.TYPEORM_HOST || 'localhost';
const dbConnection = createDbConnection({
  name: 'default',
  type: 'postgres' as any,
  host,
  port: process.env.TYPEORM_HOST === 'localhost' ? 5432 : undefined,
  username: process.env.TYPEORM_USERNAME || 'postgres',
  password: process.env.TYPEORM_PASSWORD || 'docker',
  database: process.env.TYPEORM_DATABASE || 'auth_db',
  logging: process.env.TYPEORM_LOGGING,
  synchronize: process.env.TYPEORM_SYNCHRONIZE,
  dropSchema: false
});

const app: any = {};
const port = (process.env.PORT || 8080) as number;
const uri = `http://localhost:${port}/graphql`;

(async () => {
  const logger = getLogger('app.js');
  logger.info(
    util.format(
      'db: %j',
      omit(dbConnection, 'username', 'password', 'entities')
    )
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
      }
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
