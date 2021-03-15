require('./env');
import util from 'util';
import { buildFederatedSchema } from '@apollo/federation';
import { buildRedisOptions, createService, getLogger } from '@fabric-es/gateway-lib';
import {
  didDocumentTypeDefs,
  DidDocument,
  DidDocumentEvents,
  didDocumentReducer,
  didDocumentResolvers,
  didDocumentIndexDefinition,
  DidDocumentInRedis,
  didDocumentPreSelector,
  didDocumentPostSelector,
} from '@fabric-es/model-identity';
import { Wallets } from 'fabric-network';

const logger = getLogger('service-did.js');

void (async () =>
  createService({
    enrollmentId: process.env.ORG_ADMIN_ID,
    serviceName: 'document',
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
      const app = config(
        buildFederatedSchema([
          {
            typeDefs: didDocumentTypeDefs,
            resolvers: didDocumentResolvers,
          },
        ])
      )
        .addRepository<DidDocument, DidDocumentInRedis, DidDocument, DidDocumentEvents>(
          DidDocument,
          {
            reducer: didDocumentReducer,
            fields: didDocumentIndexDefinition,
            preSelector: didDocumentPreSelector,
            postSelector: didDocumentPostSelector,
          }
        )
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

      void app.listen({ port: process.env.SERVICE_DID_PORT }).then(({ url }) => {
        logger.info(`🚀  '${process.env.MSPID}' - 'document' available at ${url}`);
        process.send?.('ready');
      });
    })
    .catch((error) => {
      console.error(error);
      logger.error(util.format('fail to start service, %j', error));
      process.exit(1);
    }))();
