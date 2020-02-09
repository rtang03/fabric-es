require('dotenv').config({ path: './.env' });

import { createGateway } from '@espresso/gw-node';
import http from 'http';
import process from 'process';
import stoppable from 'stoppable';
import util from 'util';
import { getLogger } from './logger';

const PORT = (process.env.GATEWAY_PORT || 4001) as number;
const authenticationCheck = process.env.AUTHORIZATION_SERVER_URI;
const app: any = {};

(async () => {
  const logger = getLogger('app.js');
  const server = await createGateway({
    serviceList: [
      {
        name: 'user',
        url: `http://${process.env.GATEWAY_HOST}:${process.env.SERVICE_USER_PORT}/graphql`
      },
      {
        name: 'loan',
        url: `http://${process.env.GATEWAY_HOST}:${process.env.SERVICE_LOAN_PORT}/graphql`
      },
      {
        name: 'document',
        url: `http://${process.env.GATEWAY_HOST}:${process.env.SERVICE_DOCUMENT_PORT}/graphql`
      },
      {
        name: 'private',
        url: `http://${process.env.GATEWAY_HOST}:${process.env.SERVICE_PRIVATE_PORT}/graphql`
      },
      {
        name: 'admin',
        url: `http://${process.env.GATEWAY_HOST}:${process.env.ADMINISTRATOR_PORT}/graphql`
      }
    ],
    authenticationCheck,
    useCors: true,
    debug: false
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

  stoppableServer.listen(PORT, '0.0.0.0', () => {
    console.log(
      `🚀 Server at http://${process.env.GATEWAY_HOST}:${PORT}/graphql`
    );
    logger.info(
      `🚀 Server at http://${process.env.GATEWAY_HOST}:${PORT}/graphql`
    );
    process.send('ready');
  });
})().catch(error => {
  console.log(error);
  console.error(error.stack);
  process.exit(0);
});
