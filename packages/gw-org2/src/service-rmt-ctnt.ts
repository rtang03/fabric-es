import stoppable from 'stoppable';

require('./env');
import { createRemoteService } from '@espresso/gw-node';
import {
  docContentsRemoteResolvers,
  docContentsRemoteTypeDefs
} from '@espresso/model-loan-private';
import http from 'http';
import util from 'util';
import { getLogger } from './logger';

const logger = getLogger('service-rmt-ctnt.js');

(async () => {
  const server = await createRemoteService({
    name: process.env.ORGNAME,
    typeDefs: docContentsRemoteTypeDefs,
    resolvers: docContentsRemoteResolvers,
    uriResolver: {
      resolve: entityId => {
        return new Promise(resolve => {
          resolve('http://localhost:4001/graphql'); // TODO : Temp measure!!! need a REAL uriResolver
        });
      }
    }
  });

  const stoppableServer = stoppable(http.createServer(server));

  const shutdown = () => {
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
    shutdown();
  });

  process.on('SIGTERM', () => {
    shutdown();
  });

  process.on('uncaughtException', err => {
    logger.error('An uncaught error occurred!');
    logger.error(err.stack);
  });

  server
    .listen({ port: process.env.REMOTE_DOC_CONTENTS_PORT })
    .then(({ url }) => {
      logger.info(
        `🚀  '${process.env.ORGNAME}' - Remote 'doc contents' data ready at ${url}graphql`
      );
      process.send('ready');
    });
})().catch(error => {
  console.error(error);
  logger.error(util.format('fail to start service, %j', error));
  process.exit(1);
});
