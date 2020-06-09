require('./env');
import util from 'util';
import { getReducer } from '@fabric-es/fabric-cqrs';
import { createService, getLogger } from '@fabric-es/gateway-lib';
import {
  Document,
  DocumentEvents,
  documentReducer,
  documentResolvers,
  documentTypeDefs,
} from '@fabric-es/model-document';
import { Wallets } from 'fabric-network';
import Redis from 'ioredis';

const logger = getLogger('service-doc.js');
const reducer = getReducer<Document, DocumentEvents>(documentReducer);

(async () =>
  createService({
    enrollmentId: process.env.ORG_ADMIN_ID,
    serviceName: 'document',
    reducers: { document: reducer },
    channelName: process.env.CHANNEL_NAME,
    connectionProfile: process.env.CONNECTION_PROFILE,
    wallet: await Wallets.newFileSystemWallet(process.env.WALLET),
    asLocalhost: !(process.env.NODE_ENV === 'production'),
    redis: new Redis({ host: process.env.REDIS_HOST, port: parseInt(process.env.REDIS_PORT, 10) }),
  })
    .then(async ({ config, shutdown, getRepository }) => {
      const app = await config({
        typeDefs: documentTypeDefs,
        resolvers: documentResolvers,
      })
        .addRepository(getRepository<Document, DocumentEvents>('document'))
        .create();

      process.on('SIGINT', async () => await shutdown(app));

      process.on('SIGTERM', async () => await shutdown(app));

      process.on('uncaughtException', (err) => {
        logger.error('An uncaught error occurred!');
        logger.error(err.stack);
      });

      app.listen({ port: process.env.SERVICE_DOCUMENT_PORT }).then(({ url }) => {
        logger.info(`🚀  '${process.env.MSPID}' - 'document' available at ${url}`);
        if (process.env.NODE_ENV === 'production') process.send('ready');
      });
    })
    .catch((error) => {
      console.error(error);
      logger.error(util.format('fail to start service, %j', error));
      process.exit(1);
    }))();
