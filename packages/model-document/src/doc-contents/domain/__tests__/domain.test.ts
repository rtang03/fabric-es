import {
  Commit,
  getPrivateMockRepository,
  getReducer,
  PrivateRepository,
} from '@fabric-es/fabric-cqrs';
import {
  DocContents,
  DocContentsEvents,
  docContentsReducer,
  docContentsCommandHandler,
} from '../../../doc-contents';

const enrollmentId = '';
const userId = 'USER001';
const mockdb: Record<string, Commit> = {};
export const docContentsRepo = getPrivateMockRepository<DocContents, DocContentsEvents>(
  mockdb,
  'docContents',
  getReducer<DocContents, DocContentsEvents>(docContentsReducer)
) as PrivateRepository;

describe('DocContents tests', () => {
  it('create and query docContents: data', async () => {
    await docContentsCommandHandler({ enrollmentId, docContentsRepo }).CreateDocContents({
      userId,
      payload: {
        documentId: 'DOCID011',
        content: { body: 'This is JSON data' },
        timestamp: 1542385175331,
      },
    });
    return docContentsRepo
      .getById({ enrollmentId, id: 'DOCID011' })
      .then(({ currentState }) =>
        expect(
          currentState.documentId === 'DOCID011' &&
            currentState.content.body === 'This is JSON data'
        ).toBeTruthy()
      );
  });

  it('create and query docContents: file', async () => {
    await docContentsCommandHandler({ enrollmentId, docContentsRepo }).CreateDocContents({
      userId,
      payload: {
        documentId: 'DOCID012',
        content: { format: 'PDF', link: 'localhost/docs/DOCID012' },
        timestamp: 1542385175331,
      },
    });
    return docContentsRepo
      .getById({ enrollmentId, id: 'DOCID012' })
      .then(({ currentState }) =>
        expect(
          currentState.documentId === 'DOCID012' && currentState.content.format === 'PDF'
        ).toBeTruthy()
      );
  });
});
