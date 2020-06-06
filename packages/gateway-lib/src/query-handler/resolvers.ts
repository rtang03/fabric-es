import { Commit } from '@fabric-es/fabric-cqrs';
import { RedisPubSub } from 'graphql-redis-subscriptions';
import { withFilter } from 'graphql-subscriptions';

const SOMETHING_CHANGED_TOPIC = 'TEST';

export const resolvers = {
  Mutation: {
    addMessage: async (_, { message }, { pubsub }: { pubsub: RedisPubSub }) => {
      await pubsub.publish(SOMETHING_CHANGED_TOPIC, message);
      return true;
    },
  },
  Query: {
    queryByEntityName: async (
      _,
      { entityName, entityId },
      { pubsub }: { pubsub: RedisPubSub }
    ): Promise<Commit[]> => {
      return [
        {
          id: '',
          entityName: '',
          commitId: '',
          version: 0,
          entityId: '',
          events: [],
        },
      ];
    },
  },
  Subscription: {
    somethingChanged: {
      resolve: (payload) => ({ payload }),
      subscribe: (_, args, { pubsub }: { pubsub: RedisPubSub }) =>
        pubsub.asyncIterator([SOMETHING_CHANGED_TOPIC]),
      // subscribe: withFilter(
      //   (_, args) => pubsub.asyncIterator(`${SOMETHING_CHANGED_TOPIC}.${args.relevantId}`),
      //   (payload, variables) => payload.somethingChanged.id === variables.relevantId
      // ),
    },
  },
};
