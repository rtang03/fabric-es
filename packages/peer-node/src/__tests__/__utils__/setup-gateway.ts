import { ApolloGateway } from '@apollo/gateway';
import { ApolloServer } from 'apollo-server-express';
import { AuthenticatedDataSource } from '../../utils';

const gateway = new ApolloGateway({
  serviceList: [
    { name: 'user',     url: 'http://localhost:14001/graphql' },
    { name: 'loan',     url: 'http://localhost:14002/graphql' },
    { name: 'document', url: 'http://localhost:14003/graphql' },
    { name: 'private',  url: 'http://localhost:14004/graphql' }
  ],
  buildService: ({ url }) => new AuthenticatedDataSource({ url })
});

export const constructTestServer: () => Promise<ApolloServer> = async () =>
  new ApolloServer({
    gateway,
    subscriptions: false,
    context: () => ({ client_id: 'admin' })
  });
