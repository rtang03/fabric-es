require('./env');
import util from 'util';
import { createRemoteService, getLogger } from '@fabric-es/gateway-lib';
import { docContentsRemoteResolvers, docContentsRemoteTypeDefs } from '@fabric-es/model-document';

const logger = getLogger('service-rmt-ctnt.js');

(async () => {
  const { server, shutdown } = await createRemoteService({
    name: process.env.ORGNAME,
    typeDefs: docContentsRemoteTypeDefs,
    resolvers: docContentsRemoteResolvers,
    urls: process.env.REMOTE_URI.split(' ')
  });

  process.on('SIGINT', async () => await shutdown(server)
    .then(() => process.exit(0))
    .catch(() => process.exit(1)));
  process.on('SIGTERM', async () => await shutdown(server)
    .then(() => process.exit(0))
    .catch(() => process.exit(1)));
  process.on('uncaughtException', err => {
    logger.error('An uncaught error occurred!');
    logger.error(err.stack);
  });

  server.listen({ port: process.env.REMOTE_DOC_CONTENTS_PORT }).then(({ url }) => {
    logger.info(`🚀  '${process.env.MSPID}' - Remote 'rDocContents' ready at ${url}graphql`);
    process.send?.('ready');
  });
})().catch(error => {
  console.error(error);
  logger.error(util.format('fail to start service, %j', error));
  process.exit(1);
});
