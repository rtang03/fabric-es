import { ProposalErrorResponse, ProposalResponse } from 'fabric-client';
import Listr, { ListrTaskWrapper } from 'listr';
import { isProposalErrorResponse, isProposalResponse } from './typeGuard';

export const installChaincodeSubTask = (
  responses: Array<ProposalResponse | ProposalErrorResponse>,
  task: ListrTaskWrapper
) =>
  new Listr(
    responses.map(res =>
      isProposalResponse(res)
        ? {
            title: `installed ${res.peer.name}`,
            task: () => Promise.resolve()
          }
        : isProposalErrorResponse(res)
        ? {
            title: res.message,
            task: () => task.skip('installation error')
          }
        : {
            title: 'unknown error',
            task: () => task.skip('unknown error')
          }
    )
  );
