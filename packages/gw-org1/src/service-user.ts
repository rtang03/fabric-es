require('./env');
import { createService } from '@espresso/gw-node';
import {
  User,
  UserEvents,
  userReducer,
  userResolvers,
  userTypeDefs
} from '@espresso/model-common';

createService({
  enrollmentId: 'admin',
  defaultEntityName: 'user',
  defaultReducer: userReducer
}).then(async ({ config, getRepository }) => {
  const app = await config({
    typeDefs: userTypeDefs,
    resolvers: userResolvers
  }).addRepository(getRepository<User, UserEvents>({
    entityName: 'user',
    reducer: userReducer
  })).create();

  app
    .listen({ port: 14011 })
    .then(({ url }) => console.log(`🚀  '${process.env.ORGNAME}' - 'user*****' available at ${url}`));
}).catch(error => {
  console.log(error);
  console.error(error.stack);
  process.exit(0);
});
