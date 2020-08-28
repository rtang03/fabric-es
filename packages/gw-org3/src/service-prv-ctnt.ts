require('./env');
import util from 'util';
import { getReducer } from '@fabric-es/fabric-cqrs';
import { createService, getLogger } from '@fabric-es/gateway-lib';
import {
  DocContents,
  DocContentsEvents,
  docContentsReducer,
  docContentsResolvers,
  docContentsTypeDefs,
  Document,
  DocumentEvents,
  documentReducer
} from '@fabric-es/model-document';
import { Wallets } from 'fabric-network';
import Redis from 'ioredis';

const logger = getLogger('service-prv-ctnt.js');
const reducer = getReducer<DocContents, DocContentsEvents>(docContentsReducer);

(async () =>
  createService({
    enrollmentId: process.env.ORG_ADMIN_ID,
    serviceName: 'docContents',
    isPrivate: true,
    channelName: process.env.CHANNEL_NAME,
    connectionProfile: process.env.CONNECTION_PROFILE,
    wallet: await Wallets.newFileSystemWallet(process.env.WALLET),
    asLocalhost: !(process.env.NODE_ENV === 'production'),
    redis: new Redis({ host: process.env.REDIS_HOST, port: parseInt(process.env.REDIS_PORT, 10) }),
  })
    .then(async ({ config, shutdown, getRepository, getPrivateRepository }) => {
      const app = await config({
        typeDefs: docContentsTypeDefs,
        resolvers: docContentsResolvers,
      })
        .addRepository(getPrivateRepository<DocContents, DocContentsEvents>('docContents', reducer, 'document'))
        .addRepository(getRepository<Document, DocumentEvents>('document', getReducer<Document, DocumentEvents>(documentReducer)))
        .create();

      process.on('SIGINT', async () => await shutdown(app)
        .then(() => process.exit(0))
        .catch(() => process.exit(1)));

      process.on('SIGTERM', async () => await shutdown(app)
        .then(() => process.exit(0))
        .catch(() => process.exit(1)));

      process.on('uncaughtException', (err) => {
        logger.error('An uncaught error occurred!');
        logger.error(err.stack);
      });

      app.listen({ port: process.env.PRIVATE_DOC_CONTENTS_PORT }).then(({ url }) => {
        logger.info(`🚀  '${process.env.MSPID}' - 'docContents' available at ${url}`);
        process.send?.('ready');
      });
    })
    .catch((error) => {
      console.error(error);
      logger.error(util.format('fail to start service, %j', error));
      process.exit(0);
    }))();
