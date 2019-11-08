import { Commit, getMockRepository } from '@espresso/fabric-cqrs';
import {
  Document,
  DocumentEvents,
  documentReducer
} from '../../document';
import {
  Loan,
  LoanEvents,
  loanReducer,
} from '../../loan';
import {
  User,
  UserEvents,
  userReducer
} from '../../user';

export const mockdb: Record<string, Commit> = {
  '20181114163145704:example@gmail.com': {
    committedAt: '1542213105704',
    entityName: 'typeDefs.onchain.ts.ts',
    entityId: 'example@gmail.com',
    id: 'example@gmail.com',
    commitId: '20181114163145704:example@gmail.com',
    version: 0,
    events: [
      {
        payload: {
          name: 'Mr. Example',
          timestamp: 1542213105704,
          userId: 'example@gmail.com'
        },
        type: 'UserCreated'
      }
    ]
  },
  '20181114163145708:editor@gmail.com': {
    committedAt: '1542213105708',
    entityName: 'typeDefs.onchain.ts.ts',
    entityId: 'editor@gmail.com',
    id: 'editor@gmail.com',
    commitId: '20181114163145708:editor@gmail.com',
    version: 0,
    events: [
      {
        payload: {
          name: 'Mr Editor',
          timestamp: 1542213105708,
          userId: 'editor@gmail.com'
        },
        type: 'UserCreated'
      }
    ]
  },
  '20181114163145705:reviewer@gmail.com': {
    committedAt: '1542213105705',
    entityName: 'typeDefs.onchain.ts.ts',
    entityId: 'reviewer@gmail.com',
    id: 'reviewer@gmail.com',
    commitId: '20181114163145705:reviewer@gmail.com',
    version: 0,
    events: [
      {
        payload: {
          name: 'Mr Reviewer',
          timestamp: 1542213105705,
          userId: 'reviewer@gmail.com'
        },
        type: 'UserCreated'
      }
    ]
  },
  '20181114163145706:voter@gmail.com': {
    committedAt: '1542213105706',
    entityName: 'typeDefs.onchain.ts.ts',
    entityId: 'voter@gmail.com',
    id: 'voter@gmail.com',
    commitId: '20181114163145706:voter@gmail.com',
    version: 0,
    events: [
      {
        payload: {
          name: 'Mr Voter',
          timestamp: 1542213105706,
          userId: 'voter@gmail.com'
        },
        type: 'UserCreated'
      }
    ]
  },
  '20181114163145707:canUpdateTrade@gmail.com': {
    committedAt: '1542213105707',
    entityName: 'typeDefs.onchain.ts.ts',
    entityId: 'canUpdateTrade@gmail.com',
    id: 'canUpdateTrade@gmail.com',
    commitId: '20181114163145707:canUpdateTrade@gmail.com',
    version: 0,
    events: [
      {
        payload: {
          name: 'Mr canUpdateTrade',
          timestamp: 15422131057067,
          userId: 'canUpdateTrade@gmail.com'
        },
        type: 'UserCreated'
      }
    ]
  },
  '20181116025054374:123456': {
    committedAt: '1542336654374',
    entityName: 'loan.ts',
    entityId: '123456',
    id: '123456',
    commitId: '20181116025054374:123456',
    version: 0,
    events: [
      {
        payload: {
          loanId: '123456',
          userId: 'example@gmail.com',
          timestamp: 1542336654365
        },
        type: 'LoanApplied'
      },
      {
        payload: {
          loanId: '123456',
          timestamp: 1542336654365,
          reference: 'How to Eat the Best Fruit'
        },
        type: 'LoanReferenceDefined'
      },
      {
        payload: {
          description:
            'After having a mild stroke each time my boyfriend brought home the wrong type of fruit',
          loanId: '123456',
          timestamp: 1542336654365
        },
        type: 'LoanDescriptionDefined'
      },
      {
        payload: {
          loanId: '123456',
          timestamp: 1542336654365,
          loaner: 'Dai Yee Lung'
        },
        type: 'LoanerDefined'
      },
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
      {
        payload: {
          userId: 'example@gmail.com',
          documentId: '1542385173331',
          timestamp: 1543041982770
        },
        type: 'DocumentCreated'
      },
      {
        payload: {
          documentId: '1542385173331',
          title: 'Top 15+ UK Scholarships for International Students',
          timestamp: 1543041982770
        },
        type: 'DocumentTitleDefined'
      },
      {
        payload: {
          documentId: '1542385173331',
          reference: 'REF0001',
          timestamp: 1543041982770
        },
        type: 'DocumentReferenceDefined'
      },
      {
        payload: {
          documentId: '1542385173331',
          loanId: '123456',
          timestamp: 1543041982770
        },
        type: 'DocumentLoanIdDefined'
      },
      {
        payload: {
          documentId: '1542385173331',
          link: 'www.example.com',
          timestamp: 1543041982770
        },
        type: 'DocumentLinkDefined'
      }
    ]
  }
};

export const userRepo = getMockRepository<User, UserEvents>(
  mockdb,
  'user',
  userReducer
);

export const loanRepo = getMockRepository<Loan, LoanEvents>(
  mockdb,
  'loan',
  loanReducer
);

export const documentRepo = getMockRepository<Document, DocumentEvents>(
  mockdb,
  'document',
  documentReducer
);