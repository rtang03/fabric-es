require('./env');
import util from 'util';
import { buildRedisOptions, createService, getLogger, ServiceType } from '@fabric-es/gateway-lib';
import {
  DocContents,
  docContentsReducer,
  docContentsResolvers,
  docContentsTypeDefs,
} from '@fabric-es/model-document';
import { Wallets } from 'fabric-network';
import {
  Document,
  documentReducer,
  documentIndices,
  documentPostSelector,
  documentPreSelector,
} from './model/public/document';

const serviceName = 'docContents';
const logger = getLogger('service-prv-ctnt.js');

void (async () =>
  createService({
    enrollmentId: process.env.ORG_ADMIN_ID,
    serviceName,
    type: ServiceType.Private,
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
        typeDefs: docContentsTypeDefs,
        resolvers: docContentsResolvers,
      }])
      .addRepository(Document, {
        reducer: documentReducer,
        fields: documentIndices,
        preSelector: documentPreSelector,
        postSelector: documentPostSelector,
      })
      .addPrivateRepository(DocContents, docContentsReducer)
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

      void app.listen({ port: process.env.PRIVATE_DOC_CONTENTS_PORT }).then(({ url }) => {
        logger.info(`🚀  '${process.env.MSPID}' - '${serviceName}' available at ${url}`);
        process.send?.('ready');
      });
    })
    .catch((error) => {
      console.error(error);
      logger.error(util.format('fail to start service, %j', error));
      process.exit(1);
    }))();
