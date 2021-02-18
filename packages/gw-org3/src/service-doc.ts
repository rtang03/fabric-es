require('./env');
import util from 'util';
import { getReducer } from '@fabric-es/fabric-cqrs';
import { createService, getLogger } from '@fabric-es/gateway-lib';
import { Wallets } from 'fabric-network';
import {
  Document,
  DocumentEvents,
  documentIndexDefinition,
  DocumentInRedis,
  documentReducer,
  documentResolvers,
  documentTypeDefs,
  OutputDocument,
  postSelector,
  preSelector,
} from './model/public/document';

const logger = getLogger('service-doc.js');
const reducer = getReducer<Document, DocumentEvents>(documentReducer);

void (async () =>
  createService({
    enrollmentId: process.env.ORG_ADMIN_ID,
    serviceName: 'document',
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
      const app = config({
        typeDefs: documentTypeDefs,
        resolvers: documentResolvers,
      })
        .addRedisRepository<Document, DocumentInRedis, OutputDocument>({
          entityName: 'document',
          fields: documentIndexDefinition,
          preSelector,
          postSelector,
        })
        .addRepository<Document, DocumentEvents>('document', reducer)
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
        logger.info(`🚀  '${process.env.MSPID}' - 'document' available at ${url}`);
        process.send?.('ready');
      });
    })
    .catch((error) => {
      console.error(error);
      logger.error(util.format('fail to start service, %j', error));
      process.exit(1);
    }))();
