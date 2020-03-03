import { Commit, getMockRepository, getReducer } from '@espresso/fabric-cqrs';
import { Document, documentCommandHandler, DocumentEvents, documentReducer, DocumentStatus } from '../..';
import { Loan, loanCommandHandler, LoanEvents, loanReducer } from '../../../loan';

const enrollmentId = '';
const userId = 'USER002';
const mockdb: Record<string, Commit> = {};
const loanRepo = getMockRepository<Loan, LoanEvents>(mockdb, 'loan', getReducer<Loan, LoanEvents>(loanReducer));
const documentRepo = getMockRepository<Document, DocumentEvents>(
  mockdb, 'document', getReducer<Document, DocumentEvents>(documentReducer)
);

beforeAll(async () => {
  await loanCommandHandler({ enrollmentId, loanRepo }).ApplyLoan({
    userId,
    payload: { loanId: 'LOANID001', reference: 'LOANREF001', description: 'HOWAREYOUTODAY', timestamp: Date.now() }
  });

  await loanCommandHandler({ enrollmentId, loanRepo }).ApplyLoan({
    userId,
    payload: { loanId: 'LOANID002', reference: 'LOANREF002', description: 'HOWAREYOUTODAY', timestamp: Date.now() }
  });

  await documentCommandHandler({ enrollmentId, documentRepo }).CreateDocument({
    userId,
    payload: {
      documentId: 'DOCID001',
      loanId: 'LOANID001',
      title: 'The Mother of All Purchase Orders',
      reference: 'DOCREF001',
      timestamp: Date.now()
    }
  });

  await documentCommandHandler({ enrollmentId, documentRepo }).CreateDocument({
    userId,
    payload: {
      documentId: 'DOCID002',
      loanId: 'LOANID002',
      title: 'The Father of All Purchase Orders',
      reference: 'DOCREF002',
      timestamp: Date.now()
    }
  });

  await documentCommandHandler({ enrollmentId, documentRepo }).CreateDocument({
    userId,
    payload: {
      documentId: 'DOCID003',
      title: 'The Daughter of All Purchase Orders',
      reference: 'DOCREF003',
      timestamp: Date.now()
    }
  });

  await documentCommandHandler({ enrollmentId, documentRepo }).CreateDocument({
    userId,
    payload: { documentId: 'DOCID004', reference: 'DOCREF004', timestamp: Date.now() }
  });

  await documentCommandHandler({ enrollmentId, documentRepo }).CreateDocument({
    userId,
    payload: { documentId: 'DOCID005', loanId: 'LOANID005', reference: 'DOCREF005', timestamp: Date.now() }
  });

  await documentCommandHandler({ enrollmentId, documentRepo }).CreateDocument({
    userId,
    payload: {
      documentId: 'DOCID006',
      title: 'The Grandy of All Purchase Orders',
      loanId: 'LOANID006',
      reference: 'DOCREF006',
      timestamp: Date.now()
    }
  });
});

describe('Document CommandHandler test', () => {
  it('creating a new document', async () => {
    await documentCommandHandler({ enrollmentId, documentRepo }).CreateDocument({
      userId,
      payload: {
        documentId: 'DOCID010',
        loanId: 'LOANID001',
        title: 'Very Important Document',
        reference: 'DOCREF010',
        timestamp: Date.now()
      }
    });
    return documentRepo
      .getById({ enrollmentId, id: 'DOCID010' })
      .then(({ currentState }) =>
        expect(
          currentState.title === 'Very Important Document' &&
            currentState.loanId === 'LOANID001' &&
            currentState.reference === 'DOCREF010' &&
            currentState.status === DocumentStatus.DocumentCreated
        ).toBeTruthy()
      );
  });

  it('creating a document without reference', async () => {
    expect.assertions(1);
    return documentCommandHandler({ enrollmentId, documentRepo })
      .CreateDocument({
        userId,
        payload: {
          documentId: 'DOCID099',
          loanId: 'LOANID001',
          title: 'Very Important Document 2',
          reference: null,
          timestamp: Date.now()
        }
      })
      .catch(({ message }) => expect(message).toEqual('REQUIRED_DATA_MISSING'));
  });

  it('delete a document', async () => {
    await documentCommandHandler({ enrollmentId, documentRepo }).DeleteDocument({
      userId,
      payload: {
        documentId: 'DOCID001',
        timestamp: Date.now()
      }
    });
    return documentRepo
      .getById({ enrollmentId, id: 'DOCID001' })
      .then(({ currentState }) =>
        expect(
          currentState.title === 'The Mother of All Purchase Orders' &&
            currentState.status === DocumentStatus.DocumentDeleted
        ).toBeTruthy()
      );
  });

  it('restrict access to a document', async () => {
    await documentCommandHandler({ enrollmentId, documentRepo }).RestrictDocumentAccess({
      userId,
      payload: {
        documentId: 'DOCID002',
        timestamp: Date.now()
      }
    });
    return documentRepo
      .getById({ enrollmentId, id: 'DOCID002' })
      .then(({ currentState }) =>
        expect(
          currentState.title === 'The Father of All Purchase Orders' &&
            currentState.status === DocumentStatus.DocumentRestricted
        ).toBeTruthy()
      );
  });

  it('update title of a document', async () => {
    await documentCommandHandler({ enrollmentId, documentRepo }).DefineDocumentTitle({
      userId,
      payload: {
        documentId: 'DOCID003',
        title: 'Hello There Limited',
        timestamp: Date.now()
      }
    });
    return documentRepo
      .getById({ enrollmentId, id: 'DOCID003' })
      .then(({ currentState }) =>
        expect(
          currentState.title === 'Hello There Limited' && currentState.status === DocumentStatus.DocumentCreated
        ).toBeTruthy()
      );
  });

  it('updating a non-existing document', async () => {
    await documentCommandHandler({ enrollmentId, documentRepo })
      .DefineDocumentTitle({
        userId,
        payload: {
          documentId: '999999999',
          title: 'Hello There Limited',
          timestamp: Date.now()
        }
      })
      .catch(({ message }) => expect(message).toEqual('DOCUMENT_NOT_FOUND: id: 999999999'));
  });

  it('add loan ID to a document', async () => {
    await documentCommandHandler({ enrollmentId, documentRepo }).DefineDocumentLoanId({
      userId,
      payload: {
        documentId: 'DOCID004',
        loanId: 'LOANID004',
        timestamp: Date.now()
      }
    });
    return documentRepo
      .getById({ enrollmentId, id: 'DOCID004' })
      .then(({ currentState }) =>
        expect(
          currentState.loanId === 'LOANID004' && currentState.status === DocumentStatus.DocumentCreated
        ).toBeTruthy()
      );
  });

  it('update reference of a document', async () => {
    expect.assertions(1);
    return documentCommandHandler({ enrollmentId, documentRepo })
      .DefineDocumentReference({
        userId,
        payload: {
          documentId: 'DOCID005',
          reference: 'DOCREF099',
          timestamp: Date.now()
        }
      })
      .catch(({ message }) => expect(message).toEqual('INVALID_OPERATION'));
  });
});
