export * from './domain';
export * from './types';
export * from './query';

export { typeDefs as docContentsTypeDefs, resolvers as docContentsResolvers } from './typeDefs';
export {
  typeDefs as docContentsRemoteTypeDefs,
  resolvers as docContentsRemoteResolvers,
} from './remotes';
