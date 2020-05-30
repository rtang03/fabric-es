require('dotenv').config({ path: './.env.test' });
import Redis from 'ioredis';
import type { QueryDatabase } from '../types';
import { entityIndex, createQueryDatabase } from '../utils';
import { Counter, reducer } from './__utils__';

let queryDatabase: QueryDatabase;

const commit = {
  id: 'qh_proj_test_001',
  entityName: 'test_proj',
  version: 0,
  commitId: '20200528133519841',
  entityId: 'qh_proj_test_001',
  events: [
    {
      type: 'Increment',
      payload: {
        id: 'qh_proj_test_001',
        desc: 'query handler #1 proj',
        tag: 'projection',
        ts: 1590738792,
      },
    },
  ],
};
const newCommit = {
  id: 'qh_proj_test_001',
  entityName: 'test_proj',
  version: 1,
  commitId: '20200528133520841',
  entityId: 'qh_proj_test_001',
  events: [
    {
      type: 'Increment',
      payload: {
        id: 'qh_proj_test_001',
        desc: 'query handler #2 proj',
        tag: 'projection',
        ts: 1590739000,
      },
    },
  ],
};
const commits = {
  '20200528133530001': {
    id: 'qh_proj_test_002',
    entityName: 'test_proj',
    version: 0,
    commitId: '20200528133530001',
    entityId: 'qh_proj_test_001',
    events: [
      {
        type: 'Increment',
        payload: {
          id: 'qh_proj_test_002',
          desc: 'query handler #3 proj',
          tag: 'projection',
          ts: 1590740000,
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
    events: [
      {
        type: 'Increment',
        payload: {
          id: 'qh_proj_test_002',
          desc: 'query handler #4 proj',
          tag: 'projection',
          ts: 1590740001,
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
    events: [
      {
        type: 'Increment',
        payload: {
          id: 'qh_proj_test_002',
          desc: 'query handler #5 proj',
          tag: 'projection',
          ts: 1590740002,
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
    events: [
      {
        type: 'Increment',
        payload: {
          id: 'qh_proj_test_003',
          desc: 'query handler #6 proj',
          tag: 'projection',
          ts: 1590740003,
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
    events: [
      {
        type: 'Increment',
        payload: {
          id: 'qh_proj_test_003',
          desc: 'query handler #7 proj',
          tag: 'projection',
          ts: 1590740004,
        },
      },
    ],
  },
};
const key = `${commit.entityName}::${commit.entityId}::${commit.commitId}`;
const key2 = `test_proj::qh_proj_test_002`;
const key3 = `test_proj::qh_proj_test_003`;

beforeAll(async () => {
  const redis = new Redis();
  queryDatabase = createQueryDatabase(redis);

  // first commit for merge test
  await redis
    .set(key, JSON.stringify(commit))
    .then((result) => console.log(`${key} is set: ${result}`))
    .catch((result) => console.error(`${key} is not set: ${result}`));

  // delete keys for mergeBatch test
  await redis
    .del(key2)
    .then((result) => console.log(`${key2} is deleted: ${result}`))
    .catch((result) => console.error(`${key2} is not deleted: ${result}`));

  await redis
    .del(key3)
    .then((result) => console.log(`${key3} is deleted: ${result}`))
    .catch((result) => console.error(`${key3} is not deleted: ${result}`));

  // prepare eidx
  await redis
    .send_command('FT.DROP', ['eidx'])
    .then((result) => console.log(`entityIndex is dropped: ${result}`))
    .catch((result) => console.error(`entityIndex is not dropped: ${result}`));

  await redis
    .send_command('FT.CREATE', entityIndex)
    .then((result) => console.log(`entityIndex is created: ${result}`))
    .catch((result) => console.error(`entityIndex is not created: ${result}`));
});

describe('Projection db test', () => {
  it('should merge', async () =>
    queryDatabase.mergeEntity({ commit: newCommit, reducer }).then((result) =>
      expect(result).toEqual({
        status: 'OK',
        message: 'test_proj::qh_proj_test_001 merged successfully',
        result: [{ key: 'test_proj::qh_proj_test_001', status: 'OK' }],
      })
    ));

  it('should mergeBatch', async () =>
    queryDatabase
      .mergeEntityBatch({ entityName: commit.entityName, reducer, commits })
      .then((result) => {
        expect(result).toEqual({
          status: 'OK',
          message: '2 entitie(s) are merged',
          result: [
            { key: 'test_proj::qh_proj_test_002', status: 'OK' },
            { key: 'test_proj::qh_proj_test_003', status: 'OK' },
          ],
        });
      }));

  it('should fail to FT.SEARCH by invalid FIELD desc', async () =>
    queryDatabase
      .fullTextSearchEntity({ query: 'xffd;;;;;df' })
      .catch((error) => expect(error.message).toContain('Syntax error at offset')));

  it('should fail to FT.SEARCH by valid/non-existing FIELD desc', async () =>
    queryDatabase.fullTextSearchEntity({ query: 'xfdf' }).then((result) =>
      expect(result).toEqual({
        status: 'OK',
        message: 'full text search: 0 record returned',
        result: null,
      })
    ));

  it('should FT.SEARCH by FIELD desc', async () =>
    queryDatabase.fullTextSearchEntity({ query: 'handler' }).then(({ status, message, result }) => {
      expect(status).toEqual('OK');
      expect(message).toEqual('full text search: 3 record(s) returned');
      expect(result).toEqual({
        'test_proj::qh_proj_test_001': {
          value: 2,
          id: 'qh_proj_test_001',
          desc: 'query handler #2 proj',
          tag: 'projection',
          ts: 1590739000,
        },
        'test_proj::qh_proj_test_002': {
          id: 'qh_proj_test_002',
          value: 3,
          desc: 'query handler #5 proj',
          tag: 'projection',
          ts: 1590740002,
        },
        'test_proj::qh_proj_test_003': {
          id: 'qh_proj_test_003',
          value: 2,
          desc: 'query handler #7 proj',
          tag: 'projection',
          ts: 1590740004,
        },
      });
    }));
});
