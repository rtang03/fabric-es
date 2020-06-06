import { ApolloServer } from 'apollo-server';
import { RedisPubSub } from 'graphql-redis-subscriptions';
import type { Redis } from 'ioredis';
import { resolvers, typeDefs } from '.';

export const createQueryHandlerService: (option: {
  publisher: Redis;
  subscriber: Redis;
  playground?: boolean;
  introspection?: boolean;
}) => Promise<ApolloServer> = async ({
  publisher,
  subscriber,
  playground = true,
  introspection = true,
}) => {
  const pubsub = new RedisPubSub({
    publisher,
    subscriber,
  });
  const payload = {
    commentAdded: {
      id: '1',
      content: 'Hello!',
    },
  };

  await pubsub.publish('TEST', payload);

  // setup qh for subscribeHub, and pass into pubSub

  return new ApolloServer({
    typeDefs,
    resolvers,
    playground,
    introspection,
    subscriptions: {
      // onConnect: (connectionParams, webSocket) => {
      //   if (connectionParams.authToken) {
      //     return validateToken(connectionParams.authToken)
      //       .then(findUser(connectionParams.authToken))
      //       .then(user => {
      //         return {
      //           currentUser: user,
      //         };
      //       });
      //   }
      //   throw new Error('Missing auth token!');
      // },
      // onDisconnect: (webSocket, context) => {
      // },
    },
    context: () => {
      return { pubsub };
    },
  });
};
