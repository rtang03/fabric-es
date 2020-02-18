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

const logger = getLogger('service-doc.js');

createService({
  enrollmentId: process.env.ORG_ADMIN_ID,
  defaultEntityName: 'document',
  defaultReducer: documentReducer,
  collection: process.env.COLLECTION,
  channelEventHub: process.env.CHANNEL_HUB,
  channelName: process.env.CHANNEL_NAME,
  connectionProfile: process.env.CONNECTION_PROFILE,
  wallet: new FileSystemWallet(process.env.WALLET)
})
  .then(async ({ config, shutdown, getRepository }) => {
    const app = await config({
      typeDefs: documentTypeDefs,
      resolvers: documentResolvers
    })
      .addRepository(
        getRepository<Document, DocumentEvents>({
          entityName: 'document',
          reducer: documentReducer
        })
      )
      .create();

    process.on('SIGINT', async () => await shutdown(app));
    process.on('SIGTERM', async () => await shutdown(app));
    process.on('uncaughtException', err => {
      logger.error('An uncaught error occurred!');
      logger.error(err.stack);
    });

    app.listen({ port: process.env.SERVICE_DOCUMENT_PORT }).then(({ url }) => {
      logger.info(
        `🚀  '${process.env.ORGNAME}' - 'document' available at ${url}`
      );
      process.send('ready');
    });
  })
  .catch(error => {
    console.error(error);
    logger.error(util.format('fail to start service, %j', error));
    process.exit(1);
  });
