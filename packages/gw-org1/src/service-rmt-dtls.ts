require('./env');
import util from 'util';
import { createRemoteService, getLogger } from '@fabric-es/gateway-lib';
import { loanDetailsRemoteResolvers, loanDetailsRemoteTypeDefs } from '@fabric-es/model-loan-private';

const logger = getLogger('service-rmt-dtls.js');

(async () => {
  const { server, shutdown } = await createRemoteService({
    name: process.env.ORGNAME,
    typeDefs: loanDetailsRemoteTypeDefs,
    resolvers: loanDetailsRemoteResolvers,
    uriResolver: {
      resolve: entityId =>
        new Promise(resolve => {
          resolve(process.env.TEMP_REMOTE_URI.split(' ')); // TODO : Temp measure!!! need a REAL uriResolver
        })
    }
  });

  process.on('SIGINT', () => shutdown(server));
  process.on('SIGTERM', () => shutdown(server));
  process.on('uncaughtException', err => {
    logger.error('An uncaught error occurred!');
    logger.error(err.stack);
  });

  server.listen({ port: process.env.REMOTE_LOAN_DETAILS_PORT }).then(({ url }) => {
    logger.info(`🚀  '${process.env.ORGNAME}' - Remote 'loan details' data ready at ${url}graphql`);
    if (process.env.NODE_ENV === 'production') process.send('ready');
  });
})().catch(error => {
  console.error(error);
  logger.error(util.format('fail to start service, %j', error));
  process.exit(1);
});
