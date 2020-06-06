import { Commit } from '@fabric-es/fabric-cqrs';
import { catchErrors, getLogger } from '../../utils';
import { commandHanlder } from './handler';
import { Context, Counter } from './types';

const logger = getLogger('[gw-lib-test] resolvers.js');

export const resolvers = {
  Query: {
    pingCounter: () => 'I am a simple counter',
    getCounter: catchErrors(
      async (
        _,
        { counterId },
        {
          dataSources: {
            counter: { repo },
          },
          username,
        }: Context
      ): Promise<Counter> =>
        repo
          .getById({ id: counterId, enrollmentId: username })
          .then(({ currentState }) => currentState),
      { fcnName: 'getCounter', logger, useAuth: true, useAdmin: false }
    ),
  },
  Mutation: {
    increment: catchErrors(
      async (
        _,
        { counterId },
        {
          dataSources: {
            counter: { repo },
          },
          user_id,
          username,
        }: Context
      ): Promise<Commit> =>
        commandHanlder({ enrollmentId: username, counterRepo: repo }).Increment({
          userId: user_id,
          payload: { counterId, timestamp: Date.now() },
        }),
      { fcnName: 'increment', logger, useAuth: true, useAdmin: false }
    ),
    decrement: catchErrors(
      async (
        _,
        { counterId },
        {
          dataSources: {
            counter: { repo },
          },
          user_id,
          username,
        }: Context
      ): Promise<Commit> =>
        commandHanlder({
          enrollmentId: username,
          counterRepo: repo,
        }).Decrement({ userId: user_id, payload: { counterId, timestamp: Date.now() } }),
      { fcnName: 'decrement', logger, useAuth: true, useAdmin: false }
    ),
  },
};
