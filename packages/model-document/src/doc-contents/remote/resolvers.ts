import { catchResolverErrors, getLogger, queryRemoteData } from '@fabric-es/gateway-lib';
import { DocContents } from '..';
import { GET_CONTENTS_BY_ID } from '../query';

const logger = getLogger('doc-contents/remotes.js');

export const resolvers = {
  Document: {
    contents: catchResolverErrors(
      async ({ documentId }, { token }, context) =>
        queryRemoteData(
          DocContents, {
            id: documentId,
            token,
            context,
            query: GET_CONTENTS_BY_ID,
          }),
      { fcnName: 'Document/contents/remote', logger, useAuth: false }
    ),
  },
  DocContents: {
    document: ({ documentId }) => ({ __typename: 'Document', documentId })
  },
  Docs: {
    __resolveType: (obj: any) => (obj?.body ? 'Data' : obj?.format ? 'File' : null)
  }
};
