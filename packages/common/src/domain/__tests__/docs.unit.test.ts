import { Errors } from '../';
import { documentCommandHandler, DocumentStatus } from '../document';
import { loanCommandHandler } from '../loan';
import { userCommandHandler } from '../user';
import { documentRepo, loanRepo, userRepo } from './__utils__';

const enrollmentId = '';
const userId = 'USER002';

beforeAll(async () => {
  await userCommandHandler({ enrollmentId, userRepo }).CreateUser({
    userId,
    payload: { name: 'Zero Zero Two', timestamp: Date.now() }
  });

  await loanCommandHandler({ enrollmentId, userRepo, loanRepo }).ApplyLoan({
    userId, payload: { loanId: 'LOANID001', reference: 'LOANREF001', loaner: 'BANK001', description: 'HOWAREYOUTODAY', timestamp: Date.now() }
  });

  await documentCommandHandler({ enrollmentId, userRepo, documentRepo }).CreateDocument({
    userId, payload: { documentId: 'DOCID001', loanId: 'LOANID001', title: 'The Mother of All Purchase Orders', reference: 'DOCREF001', link: 'localhost/D001', timestamp: Date.now() }
  });

  await documentCommandHandler({ enrollmentId, userRepo, documentRepo }).CreateDocument({
    userId, payload: { documentId: 'DOCID002', loanId: 'LOANID002', title: 'The Father of All Purchase Orders', reference: 'DOCREF002', link: 'localhost/D002', timestamp: Date.now() }
  });

  await documentCommandHandler({ enrollmentId, userRepo, documentRepo }).CreateDocument({
    userId, payload: { documentId: 'DOCID003', title: 'The Daughter of All Purchase Orders', reference: 'DOCREF003', link: 'localhost/D003', timestamp: Date.now() }
  });

  await documentCommandHandler({ enrollmentId, userRepo, documentRepo }).CreateDocument({
    userId, payload: { documentId: 'DOCID004', reference: 'DOCREF004', link: 'localhost/D004', timestamp: Date.now() }
  });

  await documentCommandHandler({ enrollmentId, userRepo, documentRepo }).CreateDocument({
    userId, payload: { documentId: 'DOCID005', loanId: 'LOANID005', reference: 'DOCREF005', link: 'localhost/D005', timestamp: Date.now() }
  });

  await documentCommandHandler({ enrollmentId, userRepo, documentRepo }).CreateDocument({
    userId, payload: { documentId: 'DOCID006', title: 'The Grandy of All Purchase Orders', loanId: 'LOANID006', reference: 'DOCREF006', link: 'localhost/D006', timestamp: Date.now() }
  });
});

describe('Document CommandHandler test', () => {
  it('creating a new document', async () => {
    await documentCommandHandler({ enrollmentId, userRepo, documentRepo }).CreateDocument({
      userId,
      payload: {
        documentId: 'DOCID010',
        loanId: 'LOANID001',
        title: 'Very Important Document',
        reference: 'DOCREF010',
        link: 'localhost/D010',
        timestamp: Date.now()
      }
    });
    return documentRepo
      .getById({ enrollmentId, id: 'DOCID010' })
      .then(({ currentState }) =>
        expect(
          (currentState.title === 'Very Important Document') &&
          (currentState.link === 'localhost/D010') &&
          (currentState.loanId === 'LOANID001') &&
          (currentState.reference === 'DOCREF010') &&
          (currentState.status === DocumentStatus.DocumentCreated)
        ).toBeTruthy()
      );
  });

  it('creating a document without a link', async () => {
    expect.assertions(1);
    return documentCommandHandler({ enrollmentId, userRepo, documentRepo }).CreateDocument({
      userId,
      payload: {
        documentId: 'DOCID099',
        loanId: 'LOANID001',
        title: 'Very Important Document 2',
        reference: 'DOCREF099',
        link: null,
        timestamp: Date.now()
      }
    }).catch(error =>
      expect(error).toEqual(Errors.requiredDataMissing)
    );
  });

  it('delete a document', async () => {
    await documentCommandHandler({ enrollmentId, userRepo, documentRepo }).DeleteDocument({
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
          (currentState.title === 'The Mother of All Purchase Orders') &&
          (currentState.link === 'localhost/D001') &&
          (currentState.status === DocumentStatus.DocumentDeleted)
        ).toBeTruthy()
      );
  });

  it('restrict access to a document', async () => {
    await documentCommandHandler({ enrollmentId, userRepo, documentRepo }).RestrictDocumentAccess({
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
          (currentState.title === 'The Father of All Purchase Orders') &&
          (currentState.link === 'localhost/D002') &&
          (currentState.status === DocumentStatus.DocumentRestricted)
        ).toBeTruthy()
      );
  });

  it('update title of a document', async () => {
    await documentCommandHandler({ enrollmentId, userRepo, documentRepo }).DefineDocumentTitle({
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
          (currentState.title === 'Hello There Limited') &&
          (currentState.link === 'localhost/D003') &&
          (currentState.status === DocumentStatus.DocumentCreated)
        ).toBeTruthy()
      );
  });

  it('add loan ID to a document', async () => {
    await documentCommandHandler({ enrollmentId, userRepo, documentRepo }).DefineDocumentLoanId({
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
          (currentState.loanId === 'LOANID004') &&
          (currentState.link === 'localhost/D004') &&
          (currentState.status === DocumentStatus.DocumentCreated)
        ).toBeTruthy()
      );
  });

  it('update reference of a document', async () => {
    expect.assertions(1);
    return documentCommandHandler({ enrollmentId, userRepo, documentRepo }).DefineDocumentReference({
      userId,
      payload: {
        documentId: 'DOCID005',
        reference: 'DOCREF099',
        timestamp: Date.now()
      }
    }).catch(error =>
      expect(error).toEqual(Errors.invalidOperation)
    );
  });

  it('update link of a document', async () => {
    await documentCommandHandler({ enrollmentId, userRepo, documentRepo }).DefineDocumentLink({
      userId,
      payload: {
        documentId: 'DOCID006',
        link: 'localhost/D021',
        timestamp: Date.now()
      }
    });
    return documentRepo
      .getById({ enrollmentId, id: 'DOCID006' })
      .then(({ currentState }) =>
        expect(
          (currentState.title === 'The Grandy of All Purchase Orders') &&
          (currentState.link === 'localhost/D021') &&
          (currentState.status === DocumentStatus.DocumentCreated)
        ).toBeTruthy()
      );
  });
});