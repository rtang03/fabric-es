require('./env');
import { createService } from '@espresso/gw-node';
import {
  User,
  UserEvents,
  userReducer,
  userResolvers,
  userTypeDefs
} from '@espresso/model-common';
import { FileSystemWallet } from 'fabric-network';
import util from 'util';
import { getLogger } from './logger';

const logger = getLogger('service-user.js');

createService({
  enrollmentId: process.env.ORG_ADMIN_ID,
  defaultEntityName: 'user',
  defaultReducer: userReducer,
  collection: process.env.COLLECTION,
  channelEventHub: process.env.CHANNEL_HUB,
  channelName: process.env.CHANNEL_NAME,
  connectionProfile: process.env.CONNECTION_PROFILE,
  wallet: new FileSystemWallet(process.env.WALLET)
})
  .then(async ({ config, shutdown, getRepository }) => {
    const app = await config({
      typeDefs: userTypeDefs,
      resolvers: userResolvers
    })
      .addRepository(
        getRepository<User, UserEvents>({
          entityName: 'user',
          reducer: userReducer
        })
      )
      .create();

    process.on('SIGINT', async () => await shutdown(app));
    process.on('SIGTERM', async () => await shutdown(app));
    process.on('uncaughtException', err => {
      logger.error('An uncaught error occurred!');
      logger.error(err.stack);
    });

    app.listen({ port: process.env.SERVICE_USER_PORT }).then(({ url }) => {
      logger.info(`🚀  '${process.env.ORGNAME}' - 'user' available at ${url}`);
      // process.send('ready');
    });
  })
  .catch(error => {
    console.error(error);
    logger.error(util.format('fail to start service, %j', error));
    process.exit(1);
  });
