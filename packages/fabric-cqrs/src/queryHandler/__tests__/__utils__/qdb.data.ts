export const commit = {
  id: 'qh_proj_test_001',
  entityName: 'test_proj',
  version: 0,
  commitId: '20200528133519841',
  entityId: 'qh_proj_test_001',
  mspId: 'Org1MSP',
  events: [
    {
      type: 'Increment',
      payload: {
        id: 'qh_proj_test_001',
        desc: 'query handler #1 proj',
        tag: 'projection',
        _ts: 1590738792,
        _created: 1590738792,
        _creator: 'org1-admin'
      },
    },
  ],
};

export const newCommit = {
  id: 'qh_proj_test_001',
  entityName: 'test_proj',
  version: 1,
  commitId: '20200528133520841',
  entityId: 'qh_proj_test_001',
  mspId: 'Org1MSP',
  events: [
    {
      type: 'Increment',
      payload: {
        id: 'qh_proj_test_001',
        desc: 'query handler #2 proj',
        tag: 'projection',
        _ts: 1590739000,
      },
    },
  ],
};

export const commits = {
  '20200528133530001': {
    id: 'qh_proj_test_002',
    entityName: 'test_proj',
    version: 0,
    commitId: '20200528133530001',
    entityId: 'qh_proj_test_001',
    mspId: 'Org1MSP',
    events: [
      {
        type: 'Increment',
        payload: {
          id: 'qh_proj_test_002',
          desc: 'query handler #3 proj',
          tag: 'projection',
          _ts: 1590740000,
          _created: 1590740000,
          _creator: 'org1-admin'
        },
      },
    ],
  },
  '20200528133530002': {
    id: 'qh_proj_test_002',
    entityName: 'test_proj',
    version: 1,
    commitId: '20200528133530002',
    entityId: 'qh_proj_test_002',
    mspId: 'Org1MSP',
    events: [
      {
        type: 'Increment',
        payload: {
          id: 'qh_proj_test_002',
          desc: 'query handler #4 proj',
          tag: 'projection',
          _ts: 1590740001,
        },
      },
    ],
  },
  '20200528133530003': {
    id: 'qh_proj_test_002',
    entityName: 'test_proj',
    version: 2,
    commitId: '20200528133530003',
    entityId: 'qh_proj_test_002',
    mspId: 'Org1MSP',
    events: [
      {
        type: 'Increment',
        payload: {
          id: 'qh_proj_test_002',
          desc: 'query handler #5 proj',
          tag: 'projection',
          _ts: 1590740002,
        },
      },
    ],
  },
  '20200528133530004': {
    id: 'qh_proj_test_003',
    entityName: 'test_proj',
    version: 0,
    commitId: '20200528133530004',
    entityId: 'qh_proj_test_003',
    mspId: 'Org1MSP',
    events: [
      {
        type: 'Increment',
        payload: {
          id: 'qh_proj_test_003',
          desc: 'query handler #6 proj',
          tag: 'projection',
          _ts: 1590740003,
          _created: 1590740003,
          _creator: 'org1-admin'
        },
      },
    ],
  },
  '20200528133530005': {
    id: 'qh_proj_test_003',
    entityName: 'test_proj',
    version: 1,
    commitId: '20200528133530005',
    entityId: 'qh_proj_test_003',
    mspId: 'Org1MSP',
    events: [
      {
        type: 'Increment',
        payload: {
          id: 'qh_proj_test_003',
          desc: 'query handler #7 proj',
          tag: 'projection',
          _ts: 1590740004,
        },
      },
    ],
  },
};
