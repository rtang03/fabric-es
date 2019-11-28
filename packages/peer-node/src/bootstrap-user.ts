require('events').EventEmitter.defaultMaxListeners = 15;
import {
  User,
  UserEvents,
  userReducer,
  userResolvers,
  userTypeDefs
} from '@espresso/common';
import './env';
import { bootstrap } from './utils/bootstrap';

bootstrap<User, UserEvents>({
  entityName: 'user',
  port: 14001,
  enrollmentId: 'admin',
  reducer: userReducer,
  typeDefs: userTypeDefs,
  resolvers: userResolvers
});
