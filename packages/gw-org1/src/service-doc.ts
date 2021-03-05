require('./env');
import util from 'util';
import { buildFederatedSchema } from '@apollo/federation';
import { createService, getLogger } from '@fabric-es/gateway-lib';
import {
  documentIndices,
  documentPostSelector,
  documentPreSelector,
  documentReducer,
  documentResolvers,
  documentTypeDefs,
} from '@fabric-es/model-document';
import {
  Document,
  DocumentEvents,
  DocumentInRedis,
  DocumentOutput,
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
    redisOptions: {
      host: process.env.REDIS_HOST,
      port: (process.env.REDIS_PORT || 6379) as number,
      retryStrategy: (times) => {
        if (times > 3) {
          // the 4th return will exceed 10 seconds, based on the return value...
          logger.error(`Redis: connection retried ${times} times, exceeded 10 seconds.`);
          process.exit(-1);
        }
        return Math.min(times * 100, 3000); // reconnect after (ms)
      },
      reconnectOnError: (err) => {
        const targetError = 'READONLY';
        if (err.message.includes(targetError)) {
          // Only reconnect when the error contains "READONLY"
          return 1;
        }
      },
    },
  })
    .then(({ config, shutdown }) => {
      const app = config(buildFederatedSchema([{
        typeDefs: documentTypeDefs,
        resolvers: documentResolvers,
      }]))
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
