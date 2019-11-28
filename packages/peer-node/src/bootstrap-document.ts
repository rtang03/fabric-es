// NodeJS event emitter is used to listen event arrival from on-chain write operation.
// This is default implementation of PubSub() of GraphQL Subscription
// For production-grade, other PubSub, e.g. Redis may replace event emmitter, in fabric-rx-cqrs
// Thereafter, below line is no longer required.
require('events').EventEmitter.defaultMaxListeners = 15;
import {
  Document,
  DocumentEvents,
  documentReducer,
  documentResolvers,
  documentTypeDefs
} from '@espresso/common';
import './env';
import { bootstrap } from './utils/bootstrap';

bootstrap<Document, DocumentEvents>({
  entityName: 'document',
  port: 14003,
  enrollmentId: 'admin',
  reducer: documentReducer,
  typeDefs: documentTypeDefs,
  resolvers: documentResolvers
});
