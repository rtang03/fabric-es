require('./env');
import { createService } from '@espresso/gw-node';
import {
  Document,
  DocumentEvents,
  documentReducer,
  documentResolvers,
  documentTypeDefs
} from '@espresso/model-loan';
import { FileSystemWallet } from 'fabric-network';
import util from 'util';
import { getLogger } from './logger';
// import {
//   Document,
//   DocumentEvents,
//   documentReducer,
//   documentResolvers,
//   documentTypeDefs
// } from './model/public/document';

const logger = getLogger('service-doc.js');

createService({
  enrollmentId: process.env.ORG_ADMIN_ID,
  defaultEntityName: 'document',
  defaultReducer: documentReducer,
  collection: process.env.COLLECTION,
  channelEventHub: process.env.CHANNEL_HUB,
  channelName: process.env.CHANNEL_NAME,
  connectionProfile: process.env.CONNECTION_PROFILE,
  wallet: new FileSystemWallet(process.env.WALLET),
})
.then(async ({ config, getRepository }) => {
  const app = await config({
    typeDefs: documentTypeDefs,
    resolvers: documentResolvers
  })
  .addRepository(getRepository<Document, DocumentEvents>({
    entityName: 'document',
    reducer: documentReducer
  })).create();

  const shutdown = () =>
    app.stop().then(
      () => {
        logger.info('server closes');
        process.exit(0);
      },
      err => {
        logger.error(
          util.format(
            'An error occurred while shutting down service: %j',
            err
          )
        );
        process.exit(1);
      }
    );

  process.on('SIGINT', async () => await shutdown());
  process.on('SIGTERM', async () => await shutdown());
  process.on('uncaughtException', err => {
    logger.error('An uncaught error occurred!');
    logger.error(err.stack);
  });

  app
    .listen({ port: process.env.SERVICE_DOCUMENT_PORT }).then(({ url }) => {
      logger.info(`🚀  '${process.env.ORGNAME}' - 'document' available at ${url}`);
      process.send('ready');
    });
}).catch(error => {
  console.error(error);
  logger.error(util.format('fail to start service, %j', error));
  process.exit(1);
});
