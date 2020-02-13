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
  .then(async ({ config, getRepository }) => {
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
