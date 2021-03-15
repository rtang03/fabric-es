import { Lifecycle } from '@fabric-es/fabric-cqrs';
import { ApolloError, UserInputError } from 'apollo-server';
import { createDidDocument } from '../../utils';
import type { PrivateDidDocCommandHandler, PrivateDidDocumentRepo } from '../types';

export const privateDidDocCommandHandler: (option: {
  enrollmentId: string;
  repo: PrivateDidDocumentRepo;
}) => PrivateDidDocCommandHandler = ({ enrollmentId, repo }) => ({
  AddServiceEndpoint: async ({ did, payload: { id, type, serviceEndpoint } }) => {
    const { save, currentState } = await repo.getById({ enrollmentId, id: did });

    if (!currentState) throw new ApolloError('Did not found');

    return save({
      events: [{ type: 'ServiceEndpointAdded', payload: { id, type, serviceEndpoint } }],
    }).then(({ data }) => data);
  },
  AddVerificationMethod: async ({ did, payload: { controller, id, publicKeyHex } }) => {
    const { save, currentState } = await repo.getById({ enrollmentId, id: did });

    if (!currentState) throw new ApolloError('Did not found');

    return save({
      events: [
        {
          type: 'VerificationMethodAdded',
          payload: {
            type: 'Secp256k1VerificationKey2018',
            id,
            controller,
            publicKeyHex,
          },
        },
      ],
    }).then(({ data }) => data);
  },
  Create: async ({ did, payload: createDidOption }) => {
    const { currentState } = await repo.getById({ enrollmentId, id: did });
    if (currentState) throw new UserInputError('fail to create; Did already exists');

    const payload = createDidDocument(createDidOption);

    return repo
      .create({ enrollmentId, id: did })
      .save({ events: [{ type: 'DidDocumentCreated', lifeCycle: Lifecycle.BEGIN, payload }] })
      .then(({ data }) => data);
  },
  Deactivate: async ({ did, payload: { id } }) => {
    const { save, currentState } = await repo.getById({ enrollmentId, id: did });

    if (!currentState) throw new ApolloError('Did not found');

    return save({ events: [{ type: 'DidDocumentDeactivated', payload: { id } }] }).then(
      ({ data }) => data
    );
  },
  RemoveServiceEndpoint: async ({ did, payload: { id } }) => {
    const { save, currentState } = await repo.getById({ enrollmentId, id: did });

    if (!currentState) throw new ApolloError('Did not found');

    return save({ events: [{ type: 'ServiceEndpointRemoved', payload: { id } }] }).then(
      ({ data }) => data
    );
  },
  RemoveVerificationMethod: async ({ did, payload: { id } }) => {
    const { save, currentState } = await repo.getById({ enrollmentId, id: did });

    if (!currentState) throw new ApolloError('Did not found');

    return save({ events: [{ type: 'VerificationMethodRemoved', payload: { id } }] }).then(
      ({ data }) => data
    );
  },
});
