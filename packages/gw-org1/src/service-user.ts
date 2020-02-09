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

    app.listen({ port: process.env.SERVICE_USER_PORT }).then(({ url }) => {
      console.log(`🚀  '${process.env.ORGNAME}' - 'user' available at ${url}`);
      process.send('ready');
    });
  })
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
