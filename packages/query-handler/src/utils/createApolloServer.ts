import { ApolloServer } from 'apollo-server';
import { resolvers, typeDefs } from '../graphql';
import { QueryDatabase } from '../types';

export const createApolloServer: (database: QueryDatabase) => Promise<ApolloServer> = async database => {
  return new ApolloServer({
    typeDefs,
    resolvers,
    introspection: true,
    playground: true,
    dataSources: () => null,
    context: () => {}
  });
};
