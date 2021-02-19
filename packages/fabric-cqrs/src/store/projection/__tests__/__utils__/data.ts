const id = 'test_001';
export const entityName = 'store_projection';
const tag = 'store,projection';

export const commit = {
  id,
  entityName,
  version: 0,
  commitId: '20200528133519841',
  entityId: 'test_001',
  mspId: 'Org1MSP',
  events: [
    {
      type: 'Increment',
      payload: {
        id: 'test_001',
        desc: 'store #1',
        tag,
        _ts: 1590738792,
        _created: 1590738792,
        _creator: 'org1-admin',
      },
    },
  ],
};

export const newCommit = {
  id: 'test_001',
  entityName,
  version: 1,
  commitId: '20200528133520842',
  entityId: 'test_001',
  mspId: 'Org1MSP',
  events: [
    {
      type: 'Increment',
      payload: {
        id: 'test_001',
        desc: 'store #2',
        tag,
        _ts: 1590739000,
      },
    },
  ],
};

export const commits = {
  '20200528133530001': {
    id: 'test_002',
    entityName,
    version: 0,
    commitId: '20200528133530001',
    entityId: 'test_002',
    mspId: 'Org1MSP',
    events: [
      {
        type: 'Increment',
        payload: {
          id: 'test_002',
          desc: 'store #3',
          tag,
          _ts: 1590740000,
          _created: 1590740000,
          _creator: 'org1-admin',
        },
      },
    ],
  },
  '20200528133530002': {
    id: 'test_002',
    entityName,
    version: 1,
    commitId: '20200528133530002',
    entityId: 'test_002',
    mspId: 'Org1MSP',
    events: [
      {
        type: 'Increment',
        payload: {
          id: 'test_002',
          desc: 'store #4',
          tag,
          _ts: 1590740001,
        },
      },
    ],
  },
  '20200528133530003': {
    id: 'test_002',
    entityName,
    version: 2,
    commitId: '20200528133530003',
    entityId: 'test_002',
    mspId: 'Org1MSP',
    events: [
      {
        type: 'Increment',
        payload: {
          id: 'test_002',
          desc: 'store #5',
          tag,
          _ts: 1590740002,
        },
      },
    ],
  },
  '20200528133530004': {
    id: 'test_003',
    entityName,
    version: 0,
    commitId: '20200528133530004',
    entityId: 'test_003',
    mspId: 'Org1MSP',
    events: [
      {
        type: 'Increment',
        payload: {
          id: 'test_003',
          desc: 'store #6',
          tag,
          _ts: 1590740003,
          _created: 1590740003,
          _creator: 'org1-admin',
        },
      },
    ],
  },
  '20200528133530005': {
    id: 'test_003',
    entityName,
    version: 1,
    commitId: '20200528133530005',
    entityId: 'test_003',
    mspId: 'Org1MSP',
    events: [
      {
        type: 'Increment',
        payload: {
          id: 'test_003',
          desc: 'store #7',
          tag,
          _ts: 1590740004,
        },
      },
    ],
  },
};
