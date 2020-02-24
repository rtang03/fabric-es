require('./env');
import { getReducer } from '@espresso/fabric-cqrs';
import { createService, getLogger } from '@espresso/gw-node';
import {
  DocContents,
  DocContentsEvents,
  docContentsReducer,
  docContentsResolvers,
  docContentsTypeDefs
} from '@espresso/model-loan-private';
import { FileSystemWallet } from 'fabric-network';
import util from 'util';

const logger = getLogger('service-prv-ctnt.js');
const reducer = getReducer<DocContents, DocContentsEvents>(docContentsReducer);

createService({
  enrollmentId: process.env.ORG_ADMIN_ID,
  defaultEntityName: 'docContents',
  defaultReducer: reducer,
  collection: process.env.COLLECTION,
  isPrivate: true,
  channelEventHub: process.env.CHANNEL_HUB,
  channelName: process.env.CHANNEL_NAME,
  connectionProfile: process.env.CONNECTION_PROFILE,
  wallet: new FileSystemWallet(process.env.WALLET)
})
  .then(async ({ config, shutdown, getPrivateDataRepo }) => {
    const app = await config({
      typeDefs: docContentsTypeDefs,
      resolvers: docContentsResolvers
    })
      .addRepository(
        getPrivateDataRepo<DocContents, DocContentsEvents>({
          entityName: 'docContents',
          reducer
        })
      )
      .create();

    process.on('SIGINT', async () => await shutdown(app));
    process.on('SIGTERM', async () => await shutdown(app));
    process.on('uncaughtException', err => {
      logger.error('An uncaught error occurred!');
      logger.error(err.stack);
    });

    app
      .listen({ port: process.env.PRIVATE_DOC_CONTENTS_PORT })
      .then(({ url }) => {
        console.log(`🚀  '${process.env.ORGNAME}' - 'docContents' available at ${url}`);
        if (process.env.NODE_ENV === 'production') process.send('ready');
      });
  })
  .catch(error => {
    console.error(error);
    logger.error(util.format('fail to start service, %j', error));
    process.exit(1);
  });
