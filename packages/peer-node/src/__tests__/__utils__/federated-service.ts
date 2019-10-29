import { buildFederatedSchema } from '@apollo/federation';
import { ApolloServer } from 'apollo-server';
// import { resolvers, typeDefs } from '../../privatedata/resolvers';

export const getApolloServer: (option) => ApolloServer = ({ dataSources, typeDefs, resolvers }) =>
  new ApolloServer({
    schema: buildFederatedSchema([{ typeDefs, resolvers }]),
    dataSources,
    context: () => ({ enrollmentId: 'admin' })
  });
