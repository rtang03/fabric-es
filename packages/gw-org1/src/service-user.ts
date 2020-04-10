require('./env');
import util from 'util';
import { getReducer } from '@fabric-es/fabric-cqrs';
import { createService, getLogger } from '@fabric-es/gateway-lib';
import { User, UserEvents, userReducer, userResolvers, userTypeDefs } from '@fabric-es/model-common';
import { Wallets } from 'fabric-network';

const logger = getLogger('service-user.js');
const reducer = getReducer<User, UserEvents>(userReducer);

(async () =>
  createService({
    enrollmentId: process.env.ORG_ADMIN_ID,
    defaultEntityName: 'user',
    defaultReducer: reducer,
    channelName: process.env.CHANNEL_NAME,
    connectionProfile: process.env.CONNECTION_PROFILE,
    wallet: await Wallets.newFileSystemWallet(process.env.WALLET),
    asLocalhost: !(process.env.NODE_ENV === 'production')
  })
    .then(async ({ config, shutdown, getRepository }) => {
      const app = await config({
        typeDefs: userTypeDefs,
        resolvers: userResolvers
      })
        .addRepository(
          getRepository<User, UserEvents>({
            entityName: 'user',
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

      app.listen({ port: process.env.SERVICE_USER_PORT }).then(({ url }) => {
        logger.info(`🚀  '${process.env.MSPID}' - 'user' available at ${url}`);
        if (process.env.NODE_ENV === 'production') process.send('ready');
      });
    })
    .catch(error => {
      console.error(error);
      logger.error(util.format('fail to start service, %j', error));
      process.exit(1);
    }))();
