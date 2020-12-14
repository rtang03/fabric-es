import { Commit, Counter } from '@fabric-es/fabric-cqrs';
import { getLogger } from '../../utils';
import { catchErrors } from '../../utils/catchErrors';
import { commandHanlder } from './handler';
import { Context } from './types';

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
          payload: { id: counterId, tag: '', desc: '' },
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
        }).Decrement({ userId: user_id, payload: { id: counterId, tag: '', desc: '' } }),
      { fcnName: 'decrement', logger, useAuth: true, useAdmin: false }
    ),
  },
};
