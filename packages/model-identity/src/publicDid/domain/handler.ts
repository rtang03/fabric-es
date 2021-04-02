import { Lifecycle } from '@fabric-es/fabric-cqrs';
import { ApolloError, UserInputError } from 'apollo-server';
import { createDidDocument } from '../../utils';
import type { DidDocumentCommandHandler, DidDocumentRepo } from '../types';

export const didDocumentCommandHandler: (option: {
  enrollmentId: string;
  repo: DidDocumentRepo;
}) => DidDocumentCommandHandler = ({ enrollmentId, repo }) => ({
  Create: async ({ did, payload: createDidOption }) => {
    const { currentState } = await repo.getById({ enrollmentId, id: did });
    if (currentState) throw new UserInputError('fail to create; Did already exists');

    const payload = createDidDocument(createDidOption);

    return repo
      .create({ enrollmentId, id: did })
      .save({ events: [{ type: 'DidDocumentCreated', lifeCycle: Lifecycle.BEGIN, payload }] })
      .then(({ data }) => data);
  },
  AddVerificationMethod: async ({ did, signedRequest }) => {
    const { save, currentState } = await repo.getById({ enrollmentId, id: did });
    if (!currentState) throw new ApolloError('Did not found');

    return save({ events: [], signedRequest }).then(({ data }) => data);
  },
  RemoveVerificationMethod: async ({ did, signedRequest }) => {
    const { save, currentState } = await repo.getById({ enrollmentId, id: did });
    if (!currentState) throw new ApolloError('Did not found');

    // VerificationMethodRemoved
    return save({ events: [], signedRequest }).then(({ data }) => data);
  },
  AddServiceEndpoint: async ({ did, signedRequest }) => {
    const { save, currentState } = await repo.getById({ enrollmentId, id: did });
    if (!currentState) throw new ApolloError('Did not found');

    return save({ events: [], signedRequest }).then(({ data }) => data);
  },
  RemoveServiceEndpoint: async ({ did, signedRequest }) => {
    const { save, currentState } = await repo.getById({ enrollmentId, id: did });
    if (!currentState) throw new ApolloError('Did not found');

    // ServiceEndpointRemoved
    return save({ events: [], signedRequest }).then(({ data }) => data);
  },
  Deactivate: async ({ did, signedRequest }) => {
    const { save, currentState } = await repo.getById({ enrollmentId, id: did });
    if (!currentState) throw new ApolloError('Did not found');

    // DidDocumentDeactivated
    return save({ events: [], signedRequest }).then(({ data }) => data);
  },
});
