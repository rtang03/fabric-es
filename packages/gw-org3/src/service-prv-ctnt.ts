require('./env');
import { createService } from '@espresso/gw-node';
import {
  DocContents,
  DocContentsEvents,
  docContentsReducer,
  docContentsResolvers,
  docContentsTypeDefs
} from '@espresso/model-loan-private';
import { FileSystemWallet } from 'fabric-network';
import util from 'util';
import { getLogger } from './logger';

const logger = getLogger('service-prv-ctnt.js');

createService({
  enrollmentId: process.env.ORG_ADMIN_ID,
  defaultEntityName: 'docContents',
  defaultReducer: docContentsReducer,
  collection: process.env.COLLECTION,
  isPrivate: true,
  channelEventHub: process.env.CHANNEL_HUB,
  channelName: process.env.CHANNEL_NAME,
  connectionProfile: process.env.CONNECTION_PROFILE,
  wallet: new FileSystemWallet(process.env.WALLET)
})
  .then(async ({ config, getPrivateDataRepo }) => {
    const app = await config({
      typeDefs: docContentsTypeDefs,
      resolvers: docContentsResolvers
    })
      .addRepository(
        getPrivateDataRepo<DocContents, DocContentsEvents>({
          entityName: 'docContents',
          reducer: docContentsReducer
        })
      )
      .create();

    const shutdown = () =>
      app.stop().then(
        () => {
          logger.info('app closes');
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
      .listen({ port: process.env.PRIVATE_DOC_CONTENTS_PORT })
      .then(({ url }) => {
        logger.info(
          `🚀  '${process.env.ORGNAME}' - 'docContents' available at ${url}`
        );
        process.send('ready');
      });
  })
  .catch(error => {
    console.error(error);
    logger.error(util.format('fail to start service, %j', error));
    process.exit(0);
  });
