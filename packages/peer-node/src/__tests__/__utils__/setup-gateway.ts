import { ApolloGateway } from '@apollo/gateway';
import { ApolloServer } from 'apollo-server-express';

const gateway = new ApolloGateway({
  serviceList: [
    { name: 'document', url: 'http://localhost:14001/graphql' },
    { name: 'trade', url: 'http://localhost:14002/graphql' },
    { name: 'privatedata', url: 'http://localhost:14003/graphql' }
  ]
});

export const constructTestServer: () => Promise<ApolloServer> = async () => {
  const { schema, executor } = await gateway.load();
  return new ApolloServer({
    schema,
    executor
  });
};
