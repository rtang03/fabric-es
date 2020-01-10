import Listr, { ListrTaskWrapper } from 'listr';
import { isProposalErrorResponse, isProposalResponse } from './typeGuard';

export const joinChannelSubTask = (responses: any[], task: ListrTaskWrapper) =>
  new Listr(
    responses.map(res =>
      isProposalResponse(res)
        ? {
            title: `joined: ${res.peer.name} status: ${res.response.status}`,
            task: () => res.response.status
          }
        : isProposalErrorResponse(res)
        ? {
            title: res.message,
            task: () => task.skip('join channel error')
          }
        : {
            title: 'unknown error',
            task: () => task.skip('unknown error')
          }
    )
  );
