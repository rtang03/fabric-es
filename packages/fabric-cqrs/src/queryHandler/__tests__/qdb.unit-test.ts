require('dotenv').config({ path: './.env.dev' });
import Redis from 'ioredis';
import { entityIndex, createQueryDatabase, commitIndex } from '..';
import type { QueryDatabase } from '../../types';
import { reducer } from '../../unit-test-reducer';
import { commit, commits, newCommit, simpleCounterReducer } from './__utils__';

let queryDatabase: QueryDatabase;
let redis: Redis.Redis;

const key = `${commit.entityName}::${commit.entityId}::${commit.commitId}`;
const key2 = `test_proj::qh_proj_test_002`;
const key3 = `test_proj::qh_proj_test_003`;

beforeAll(async () => {
  redis = new Redis();
  queryDatabase = createQueryDatabase(redis);

  // first commit for merge test
  await redis
    .set(key, JSON.stringify(commit))
    .then((result) => console.log(`${key} is set: ${result}`))
    .catch((result) => console.log(`${key} is not set: ${result}`));

  // delete keys for mergeBatch test
  await redis
    .del(key2)
    .then((result) => console.log(`${key2} is deleted: ${result}`))
    .catch((result) => console.log(`${key2} is not deleted: ${result}`));

  await redis
    .del(key3)
    .then((result) => console.log(`${key3} is deleted: ${result}`))
    .catch((result) => console.log(`${key3} is not deleted: ${result}`));

  // prepare eidx
  await redis
    .send_command('FT.DROP', ['eidx'])
    .then((result) => console.log(`entityIndex is dropped: ${result}`))
    .catch((result) => console.log(`entityIndex is not dropped: ${result}`));

  await redis
    .send_command('FT.CREATE', entityIndex)
    .then((result) => console.log(`entityIndex is created: ${result}`))
    .catch((result) => console.log(`entityIndex is not created: ${result}`));

  await redis
    .send_command('FT.DROP', ['cidx'])
    .then((result) => console.log(`cidx is dropped: ${result}`))
    .catch((result) => console.log(`cidx is not dropped: ${result}`));

  await redis
    .send_command('FT.CREATE', commitIndex)
    .then((result) => console.log(`cidx is created: ${result}`))
    .catch((result) => console.log(`cidx is not created: ${result}`));
});

afterAll(async () => {
  await redis
    .send_command('FT.DROP', ['eidx'])
    .then((result) => console.log(`entityIndex is dropped: ${result}`))
    .catch((result) => console.log(`entityIndex is not dropped: ${result}`));

  await redis
    .send_command('FT.DROP', ['cidx'])
    .then((result) => console.log(`cidx is dropped: ${result}`))
    .catch((result) => console.log(`cidx is not dropped: ${result}`));

  // await queryDatabase
  //   .deleteCommitByEntityName({ entityName: commit.entityName })
  //   .then(({ message }) => console.log(message))
  //   .catch((result) => console.log(result));

  return new Promise((done) => setTimeout(() => done(), 2000));
});

describe('Projection db test', () => {
  it('should fail to mergeEntity with BAD reducer', async () =>
    queryDatabase
      .mergeEntity({ commit: newCommit, reducer: simpleCounterReducer })
      .then(({ status, message, error }) => {
        expect(status).toEqual('ERROR');
        expect(message).toEqual('fail to reduce to currentState');
        expect(error.message).toContain('fail to reduce');
      }));

  it('should merge', async () =>
    queryDatabase.mergeEntity({ commit: newCommit, reducer }).then((result) =>
      expect(result).toEqual({
        status: 'OK',
        message: 'test_proj::qh_proj_test_001 merged successfully',
        result: [
          { key: 'test_proj::qh_proj_test_001', status: 'OK' },
          { key: 'test_proj::qh_proj_test_001::20200528133520841', status: 'OK' },
          { key: 'eidx::test_proj::qh_proj_test_001', status: 'OK' },
          { key: 'cidx::test_proj::qh_proj_test_001::20200528133520841', status: 'OK' },
        ],
      })
    ));

  it('should fail to mergeEntityBatch with BAD reducer', async () =>
    queryDatabase
      .mergeEntityBatch({
        entityName: commit.entityName,
        reducer: simpleCounterReducer,
        commits,
      })
      .then(({ status, error, message }) => {
        expect(status).toEqual('ERROR');
        expect(error).toEqual([{ id: 'qh_proj_test_002' }, { id: 'qh_proj_test_003' }]);
      }));

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
          error: null,
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
