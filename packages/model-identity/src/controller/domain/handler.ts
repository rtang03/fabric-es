import { Lifecycle } from '@fabric-es/fabric-cqrs';
import { ApolloError, UserInputError } from 'apollo-server';
import type { ControllerCommandHandler, ControllerRepo } from '../types';

export const controllerCommandHandler: (option: {
  enrollmentId: string;
  repo: ControllerRepo;
}) => ControllerCommandHandler = ({ enrollmentId, repo }) => ({
  Create: async ({ id, payload: { did } }) => {
    const { currentState } = await repo.getById({ enrollmentId, id });
    if (currentState) throw new UserInputError('fail to create; id already exists');

    return repo
      .create({ enrollmentId, id })
      .save({
        events: [{ type: 'ControllerCreated', lifeCycle: Lifecycle.BEGIN, payload: { did, id } }],
      })
      .then(({ data }) => data);
  },
  AddDid: async ({ id, payload: { did } }) => {
    const { currentState, save } = await repo.getById({ enrollmentId, id });

    if (!currentState) throw new ApolloError('Did not found');

    return save({ events: [{ type: 'DidAdded', payload: { did } }] }).then(({ data }) => data);
  },
  RemoveDid: async ({ id, payload: { did } }) => {
    const { currentState, save } = await repo.getById({ enrollmentId, id });

    if (!currentState) throw new ApolloError('Did not found');

    return save({ events: [{ type: 'DidRemoved', payload: { did } }] }).then(({ data }) => data);
  },
});
