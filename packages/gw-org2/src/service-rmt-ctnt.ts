require('./env');
import { createRemoteService, getLogger } from '@espresso/gw-node';
import {
  docContentsRemoteResolvers,
  docContentsRemoteTypeDefs
} from '@espresso/model-loan-private';
import util from 'util';

const logger = getLogger('service-rmt-ctnt.js');

(async () => {
  const { server, shutdown } = await createRemoteService({
    name: process.env.ORGNAME,
    typeDefs: docContentsRemoteTypeDefs,
    resolvers: docContentsRemoteResolvers,
    uriResolver: {
      resolve: entityId => {
        return new Promise(resolve => {
          resolve(process.env.TEMP_REMOTE_URI); // TODO : Temp measure!!! need a REAL uriResolver
        });
      }
    }
  });

  process.on('SIGINT', () => shutdown(server));
  process.on('SIGTERM', () => shutdown(server));
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
      if (process.env.NODE_ENV === 'production') process.send('ready');
    });
})().catch(error => {
  console.error(error);
  logger.error(util.format('fail to start service, %j', error));
  process.exit(1);
});
