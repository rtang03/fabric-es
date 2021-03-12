import { UserInputError } from 'apollo-server';
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
      .save({ events: [{ type: 'DidDocumentCreated', payload }] })
      .then(({ data }) => data);
  },
  UpdateController: async ({ did, payload: { controller } }) => {
    const { save, currentState } = await didDocumentRepo.getById({ enrollmentId, id: did });

    if (!currentState) throw new Error('unknown error');

    return save({ events: [{ type: 'ControllerUpdated', payload: { controller } }] }).then(
      ({ data }) => data
    );
  },
  Deactivate: async () => {
    return null;
  },
});
