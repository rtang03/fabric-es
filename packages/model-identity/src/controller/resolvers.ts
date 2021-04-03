import { catchResolverErrors, getLogger } from '@fabric-es/gateway-lib';
import { UserInputError } from 'apollo-server';
import { controllerCommandHandler as handler } from './domain';
import type { ControllerContext } from './types';

type Args = { [K in 'id' | 'did']: string };

const logger = getLogger('controller/resolvers.js');

export const resolvers = {
  Query: {
    isControllerAlive: () => 'have a good time',
  },
  Mutation: {
    createController: catchResolverErrors(
      async (
        _,
        { did }: Args,
        {
          dataSources: {
            controller: { repo },
          },
          enrollment_id,
          user_id,
        }: ControllerContext
      ) => {
        if (!did) throw new UserInputError('missing did');

        return handler({ enrollmentId: enrollment_id, repo }).Create({
          id: user_id,
          payload: { did },
        });
      },
      { fcnName: 'create-controller', logger, useAuth: true }
    ),
    addDid: catchResolverErrors(
      async (
        _,
        { did }: Args,
        {
          dataSources: {
            controller: { repo },
          },
          enrollment_id,
          user_id,
        }: ControllerContext
      ) => {
        if (!did) throw new UserInputError('missing did');

        return handler({ enrollmentId: enrollment_id, repo }).AddDid({
          id: user_id,
          payload: { did },
        });
      },
      { fcnName: 'add-did', logger, useAuth: true }
    ),
    removeDid: catchResolverErrors(
      async (
        _,
        { did }: Args,
        {
          dataSources: {
            controller: { repo },
          },
          enrollment_id,
          user_id,
        }: ControllerContext
      ) => {
        if (!did) throw new UserInputError('missing did');

        return handler({ enrollmentId: enrollment_id, repo }).RemoveDid({
          id: user_id,
          payload: { did },
        });
      },
      { fcnName: 'remove-did', logger, useAuth: true }
    ),
  },
};
