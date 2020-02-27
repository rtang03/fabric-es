import { Commit, getMockRepository, getReducer } from '@espresso/fabric-cqrs';
import { User, UserEvents, userReducer } from '../../user';

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
  }
};

export const userRepo = getMockRepository<User, UserEvents>(mockdb, 'user', getReducer<User, UserEvents>(userReducer));
