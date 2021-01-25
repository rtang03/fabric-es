require('./env');
import util from 'util';
import { createRemoteService, getLogger } from '@fabric-es/gateway-lib';
import { loanDetailsRemoteResolvers, loanDetailsRemoteTypeDefs } from '@fabric-es/model-loan';

const logger = getLogger('service-rmt-dtls.js');

void (async () => {
  const { server, shutdown } = await createRemoteService({
    name: process.env.ORGNAME,
    typeDefs: loanDetailsRemoteTypeDefs,
    resolvers: loanDetailsRemoteResolvers,
    urls: process.env.REMOTE_URI.split(' '),
  });

  process.on(
    'SIGINT',
    async () =>
      await shutdown(server)
        .then(() => process.exit(0))
        .catch(() => process.exit(1))
  );
  process.on(
    'SIGTERM',
    async () =>
      await shutdown(server)
        .then(() => process.exit(0))
        .catch(() => process.exit(1))
  );
  process.on('uncaughtException', (err) => {
    logger.error('An uncaught error occurred!');
    logger.error(err.stack);
  });

  void server.listen({ port: process.env.REMOTE_LOAN_DETAILS_PORT }).then(({ url }) => {
    logger.info(`🚀  '${process.env.MSPID}' - Remote 'rLoanDetails' ready at ${url}graphql`);
    process.send?.('ready');
  });
})().catch((error) => {
  console.error(error);
  logger.error(util.format('fail to start service, %j', error));
  process.exit(1);
});
