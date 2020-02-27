import { docContentsRepo, loanDetailsRepo } from './__utils__';
import { docContentsCommandHandler, loanDetailsCommandHandler } from '..';

const enrollmentId = '';
const userId = 'USER002';

describe('DocContents tests', () => {
  it('create and query doc-contents: data', async () => {
    await docContentsCommandHandler({ enrollmentId, docContentsRepo }).CreateDocContents({
      userId,
      payload: { documentId: 'DOCID011', content: { body: 'This is JSON data' }, timestamp: 1542385175331 }
    });
    return docContentsRepo
      .getById({ enrollmentId, id: 'DOCID011' })
      .then(({ currentState }) =>
        expect(currentState.documentId === 'DOCID011' && currentState.content.body === 'This is JSON data').toBeTruthy()
      );
  });

  it('create and query doc-contents: file', async () => {
    await docContentsCommandHandler({ enrollmentId, docContentsRepo }).CreateDocContents({
      userId,
      payload: {
        documentId: 'DOCID012',
        content: { format: 'PDF', link: 'localhost/docs/DOCID012' },
        timestamp: 1542385175331
      }
    });
    return docContentsRepo
      .getById({ enrollmentId, id: 'DOCID012' })
      .then(({ currentState }) =>
        expect(currentState.documentId === 'DOCID012' && currentState.content.format === 'PDF').toBeTruthy()
      );
  });
});

describe('LoanDetails tests', () => {
  it('create and query loan-details', async () => {
    await loanDetailsCommandHandler({ enrollmentId, loanDetailsRepo }).CreateLoanDetails({
      userId,
      payload: {
        loanId: 'LOANID011',
        requester: { registration: 'LEI0001', name: 'Johnson International' },
        contact: { name: 'John JOhnson', phone: '555-12333', email: 'johnson@fake.it' },
        loanType: 'Post-shipment',
        startDate: 1542385275431,
        tenor: 76,
        currency: 'HKD',
        requestedAmt: 50000,
        timestamp: 1542385175431
      }
    });
    return loanDetailsRepo
      .getById({ enrollmentId, id: 'LOANID011' })
      .then(({ currentState }) => expect(currentState === 'LOANID011' && currentState.requestedAmt === 50000));
  });
});
