require('./env');
import { createRemoteService, getLogger } from '@espresso/gw-node';
import {
  loanDetailsRemoteResolvers,
  loanDetailsRemoteTypeDefs
} from '@espresso/model-loan-private';
import util from 'util';

const logger = getLogger('service-rmt-dtls.js');

(async () => {
  const { server, shutdown } = await createRemoteService({
    name: process.env.ORGNAME,
    typeDefs: loanDetailsRemoteTypeDefs,
    resolvers: loanDetailsRemoteResolvers,
    uriResolver: {
      resolve: entityId => {
        return new Promise(resolve => {
          resolve('http://localhost:4002/graphql'); // TODO : Temp measure!!! need a REAL uriResolver
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
    .listen({ port: process.env.REMOTE_LOAN_DETAILS_PORT })
    .then(({ url }) => {
      logger.info(`🚀  '${process.env.ORGNAME}' - Remote 'loan details' data ready at ${url}graphql`);
      process.send('ready');
    });
})().catch(error => {
  console.error(error);
  logger.error(util.format('fail to start service, %j', error));
  process.exit(1);
});
