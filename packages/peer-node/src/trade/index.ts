import { merge } from 'lodash';
import { userResolver } from '../user/resolvers';
import { tradeResolver } from './resolvers';

export * from './typeDefs';
export const resolvers = merge(tradeResolver, userResolver);

export * from './query';
