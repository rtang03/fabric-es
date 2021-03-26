require('./env');
import util from 'util';
import { buildRedisOptions, createService, getLogger } from '@fabric-es/gateway-lib';
import {
  Document,
  documentIndices,
  documentPostSelector,
  documentPreSelector,
  documentReducer,
  documentResolvers,
  documentTypeDefs,
} from '@fabric-es/model-document';
import { Wallets } from 'fabric-network';

const serviceName = 'document';
const logger = getLogger('service-doc.js');

void (async () =>
  createService({
    enrollmentId: process.env.ORG_ADMIN_ID,
    serviceName,
    channelName: process.env.CHANNEL_NAME,
    connectionProfile: process.env.CONNECTION_PROFILE,
    wallet: await Wallets.newFileSystemWallet(process.env.WALLET),
    asLocalhost: !(process.env.NODE_ENV === 'production'),
    redisOptions: buildRedisOptions(
      process.env.REDIS_HOST,
      (process.env.REDIS_PORT || 6379) as number,
      logger
    ),
  })
    .then(({ config, shutdown }) => {
      const app = config([{
        typeDefs: documentTypeDefs,
        resolvers: documentResolvers,
      }])
        .addRepository(Document, {
          reducer: documentReducer,
          fields: documentIndices,
          preSelector: documentPreSelector,
          postSelector: documentPostSelector,
        })
        .create();

      process.on(
        'SIGINT',
        async () =>
          await shutdown(app)
            .then(() => process.exit(0))
            .catch(() => process.exit(1))
      );

      process.on(
        'SIGTERM',
        async () =>
          await shutdown(app)
            .then(() => process.exit(0))
            .catch(() => process.exit(1))
      );

      process.on('uncaughtException', (err) => {
        logger.error('An uncaught error occurred!');
        logger.error(err.stack);
      });

      void app.listen({ port: process.env.SERVICE_DOCUMENT_PORT }).then(({ url }) => {
        logger.info(`🚀  '${process.env.MSPID}' - '${serviceName}' available at ${url}`);
        process.send?.('ready');
      });
    })
    .catch((error) => {
      console.error(error);
      logger.error(util.format('fail to start service, %j', error));
      process.exit(1);
    }))();
