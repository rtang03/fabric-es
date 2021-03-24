import { Lifecycle } from '@fabric-es/fabric-cqrs';
import { ApolloError, UserInputError } from 'apollo-server';
import type { IdentifierCommandHandler, IdentifierRepo } from '../types';

export const identifierCommandHandler: (option: {
  enrollmentId: string;
  repo: IdentifierRepo;
}) => IdentifierCommandHandler = ({ enrollmentId, repo }) => ({
  Create: async ({ id, payload: { type, ownerId } }) => {
    const { currentState } = await repo.getById({ enrollmentId, id });

    if (currentState) throw new UserInputError('fail to create; id already exists');

    return repo
      .create({ enrollmentId, id })
      .save({
        events: [
          { type: 'IdentifierCreated', lifeCycle: Lifecycle.BEGIN, payload: { id, type, ownerId } },
        ],
      })
      .then(({ data }) => data);
  },
  Activate: async ({ id }) => {
    const { currentState, save } = await repo.getById({ enrollmentId, id });

    if (!currentState) throw new ApolloError('id not found');

    return save({ events: [{ type: 'IdentifierActivated', payload: { activated: true } }] }).then(
      ({ data }) => data
    );
  },
  Deactivate: async ({ id }) => {
    const { currentState, save } = await repo.getById({ enrollmentId, id });

    if (!currentState) throw new ApolloError('id not found');

    return save({
      events: [{ type: 'IdentifierDeactivated', payload: { activated: false } }],
    }).then(({ data }) => data);
  },
  AddAttribute: async ({ id, payload }) => {
    const { currentState, save } = await repo.getById({ enrollmentId, id });

    if (!currentState) throw new ApolloError('id not found');

    return save({ events: [{ type: 'AttributeAdded', payload }] }).then(({ data }) => data);
  },
  RemoveAttribute: async ({ id, payload }) => {
    const { currentState, save } = await repo.getById({ enrollmentId, id });

    if (!currentState) throw new ApolloError('id not found');

    return save({ events: [{ type: 'AttributeRemoved', payload }] }).then(({ data }) => data);
  },
});
