import {
  Document,
  DocumentEvents,
  documentReducer,
  Loan,
  LoanEvents,
  loanReducer,
  User,
  UserEvents,
  userReducer
} from '@espresso/common';
import { Commit, getMockRepository, Repository } from '@espresso/fabric-cqrs';

/**
 * WARNING: Any change of sample data, will impact the Snapshot Testing.
 * If changes, please update the snapshot testing result.
 */
export const mockdb: Record<string, Commit> = {
  '20181114163145704:josh@fake.it': {
    committedAt: '1542213105704',
    entityName: 'user',
    entityId: 'josh@fake.it',
    id: 'josh@fake.it',
    commitId: '20181114163145704:josh@fake.it',
    version: 0,
    events: [
      {
        payload: {
          name: 'Josh',
          timestamp: 1542213105704,
          userId: 'josh@fake.it',
          mergedUserIds: ['josh@fake.it']
        },
        type: 'UserCreated'
      }
    ]
  },
  '20181116025054374:123456': {
    committedAt: '1542336654374',
    entityName: 'loan',
    entityId: '123456',
    id: '123456',
    commitId: '20181116025054374:123456',
    version: 0,
    events: [
      {
        payload: {
          loanId: '123456',
          userId: 'josh@fake.it',
          timestamp: 1542336654365
        },
        type: 'LoanApplied'
      },
      {
        payload: {
          loanId: '123456',
          timestamp: 1542336654365,
          reference: 'REF123456'
        },
        type: 'LoanReferenceDefined'
      },
      {
        payload: {
          description: 'Loan requested by an undisclosed party to an unknown bank',
          loanId: '123456',
          timestamp: 1542336654365
        },
        type: 'LoanDescriptionDefined'
      }
    ]
  },
  '20181124064622771:1542385173331': {
    commitId: '20181124064622771:1542385173331',
    committedAt: '1542385173331',
    id: '1542385173331',
    entityName: 'document',
    entityId: '1542385173331',
    version: 0,
    events: [
      { payload: { userId: 'josh@fake.it', documentId: '1542385173331', timestamp: 1543041982770 }, type: 'DocumentCreated' },
      { payload: { documentId: '1542385173331', title: 'Top 15+ UK Scholarships for International Students', timestamp: 1543041982770 }, type: 'DocumentTitleDefined' },
      { payload: { documentId: '1542385173331', reference: 'REF1542385173331', timestamp: 1543041982770 }, type: 'DocumentReferenceDefined' },
      { payload: { documentId: '1542385173331', loanId: '123456', timestamp: 1543041982770 }, type: 'DocumentLoanIdDefined' }
    ]
  },
  '20181124064622777:1542385174331': {
    commitId: '20181124064622777:1542385174331',
    committedAt: '1542385174331',
    id: '1542385174331',
    entityName: 'document',
    entityId: '1542385174331',
    version: 0,
    events: [
      { payload: { userId: 'josh@fake.it', documentId: '1542385174331', timestamp: 1543041984770 }, type: 'DocumentCreated' },
      { payload: { documentId: '1542385174331', title: 'The Mother of All Invoices', timestamp: 1543041984770 }, type: 'DocumentTitleDefined' },
      { payload: { documentId: '1542385174331', reference: 'REF1542385174331', timestamp: 1543041984770 }, type: 'DocumentReferenceDefined' },
      { payload: { documentId: '1542385174331', loanId: '123456', timestamp: 1543041984770 }, type: 'DocumentLoanIdDefined' }
    ]
  }
};

export const documentRepo: Repository = getMockRepository<Document, DocumentEvents>(
  mockdb,
  'document',
  documentReducer
);

export const loanRepo: Repository = getMockRepository<Loan, LoanEvents>(
  mockdb,
  'loan',
  loanReducer
);

export const userRepo: Repository = getMockRepository<User, UserEvents>(
  mockdb,
  'user',
  userReducer
);
