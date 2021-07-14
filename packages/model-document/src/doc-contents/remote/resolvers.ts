import { catchResolverErrors, getLogger, queryRemoteData } from '@fabric-es/gateway-lib';
import { DocContents } from '..';
import { GET_CONTENTS_BY_ID } from '../query';

const logger = getLogger('doc-contents/remotes.js');

export const resolvers = {
  Document: {
    contents: catchResolverErrors(
      async ({ documentId }, _, context) =>
        queryRemoteData(
          DocContents, {
            id: documentId,
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
