import { Lifecycle } from '@fabric-es/fabric-cqrs';
import { ApolloError, UserInputError } from 'apollo-server';
import { createDidDocument } from '../../utils';
import type { DidDocumentCommandHandler, DidDocumentRepo } from '../types';

export const didDocumentCommandHandler: (option: {
  enrollmentId: string;
  didDocumentRepo: DidDocumentRepo;
}) => DidDocumentCommandHandler = ({ enrollmentId, didDocumentRepo }) => ({
  Create: async ({ did, payload: createDidOption }) => {
    const { currentState } = await didDocumentRepo.getById({ enrollmentId, id: did });
    if (currentState) throw new UserInputError('fail to create; Did already exists');

    const payload = createDidDocument(createDidOption);

    return didDocumentRepo
      .create({ enrollmentId, id: did })
      .save({ events: [{ type: 'DidDocumentCreated', lifeCycle: Lifecycle.BEGIN, payload }] })
      .then(({ data }) => data);
  },
  AddVerificationMethod: async ({ did, payload: { controller, id, publicKeyHex } }) => {
    const { save, currentState } = await didDocumentRepo.getById({ enrollmentId, id: did });

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
  RemoveVerificationMethod: async ({ did, payload: { id } }) => {
    const { save, currentState } = await didDocumentRepo.getById({ enrollmentId, id: did });

    if (!currentState) throw new ApolloError('Did not found');

    return save({ events: [{ type: 'VerificationMethodRemoved', payload: { id } }] }).then(
      ({ data }) => data
    );
  },
  AddServiceEndpoint: async ({ did, payload: { id, type, serviceEndpoint } }) => {
    const { save, currentState } = await didDocumentRepo.getById({ enrollmentId, id: did });

    if (!currentState) throw new ApolloError('Did not found');

    return save({
      events: [{ type: 'ServiceEndpointAdded', payload: { id, type, serviceEndpoint } }],
    }).then(({ data }) => data);
  },
  RemoveServiceEndpoint: async ({ did, payload: { id } }) => {
    const { save, currentState } = await didDocumentRepo.getById({ enrollmentId, id: did });

    if (!currentState) throw new ApolloError('Did not found');

    return save({ events: [{ type: 'ServiceEndpointRemoved', payload: { id } }] }).then(
      ({ data }) => data
    );
  },
  Deactivate: async ({ did, payload: { id } }) => {
    const { save, currentState } = await didDocumentRepo.getById({ enrollmentId, id: did });

    if (!currentState) throw new ApolloError('Did not found');

    return save({ events: [{ type: 'DidDocumentDeactivated', payload: { id } }] }).then(
      ({ data }) => data
    );
  },
});
