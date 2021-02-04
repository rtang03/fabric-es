require('dotenv').config({ path: './.env.dev' });
import omit from 'lodash/omit';
import pick from 'lodash/pick';
import { Redisearch } from 'redis-modules-sdk';
import {
  Counter,
  reducer,
  counterSearchDefinition as fields,
  CounterInRedis,
  postSelector,
  preSelector,
  OutputCounter,
} from '../../unit-test-reducer';
import { REDUCE_ERR } from '../constants';
import { createQueryDatabaseV2 } from '../createQueryDatabaseV2';
import { createRedisRepository } from '../createRedisRepository';
import { isOutputCommit } from '../typeGuard';
import type { QueryDatabaseV2, RedisRepository, OutputCommit } from '../types';
import { commit, commits, faultReducer, newCommit } from './__utils__';

// const key = `${commit.entityName}::${commit.entityId}::${commit.commitId}`;
// const key2 = `test_proj::qh_proj_test_002`;
// const key3 = `test_proj::qh_proj_test_003`;

/**
 * running it: .dn-run.0-db-red.sh
 */
let queryDatabase: QueryDatabaseV2;
let client: Redisearch;
let commitRepo: RedisRepository<OutputCommit>;
let counter: RedisRepository<OutputCounter>;

const ENTITYNAME = 'test_proj';
const ENTITYID = 'qh_proj_test_001';
const noResult = { status: 'OK', message: '0 record(s) returned', result: [] };

beforeAll(async () => {
  client = new Redisearch({ host: 'localhost', port: 6379 });

  await client.connect();

  counter = createRedisRepository<Counter, CounterInRedis, OutputCounter>({
    client,
    fields,
    entityName: 'test_proj',
    postSelector,
    preSelector,
  });

  queryDatabase = createQueryDatabaseV2(client, { [ENTITYNAME]: counter });
  commitRepo = queryDatabase.getRedisCommitRepo();

  // prepare eidx
  const eidx = counter.getIndexName();
  await counter
    .dropIndex()
    .then((result) => console.log(`${eidx} is dropped: ${result}`))
    .catch((result) => console.log(`${eidx} is not dropped: ${result}`));

  await counter
    .createIndex()
    .then((result) => console.log(`${eidx} is created: ${result}`))
    .catch((result) => {
      console.log(`${eidx} is not created: ${result}`);
      process.exit(1);
    });

  const cidx = commitRepo.getIndexName();

  await commitRepo
    .dropIndex()
    .then((result) => console.log(`${cidx} is dropped: ${result}`))
    .catch((result) => console.log(`${cidx} is not dropped: ${result}`));

  await commitRepo
    .createIndex()
    .then((result) => console.log(`${cidx} is created: ${result}`))
    .catch((result) => {
      console.log(`${cidx} is not created: ${result}`);
      process.exit(1);
    });
});

afterAll(async () => {
  await client.disconnect();
  return new Promise<void>((ok) => setTimeout(() => ok(), 2000));
});

describe('Projecion db test', () => {
  it('should deleteCommitByEntityName', async () =>
    queryDatabase
      .deleteCommitByEntityName({ entityName: ENTITYNAME })
      .then(({ status }) => expect(status).toBe('OK')));

  // first commit for merge test
  it('should merge commit', async () => {
    const key = commitRepo.getKey(commit);
    // test the returned result
    const { result, status } = await queryDatabase.mergeCommit({ commit });
    expect(status).toBe('OK');
    expect(result).toStrictEqual([key]);

    // test the reselected data
    const data = await commitRepo.hgetall(key);
    expect(omit(commit, 'events')).toStrictEqual(
      pick(data, 'id', 'entityName', 'version', 'commitId', 'entityId', 'mspId')
    );
  });

  it('should fail to mergeEntity with IRRELEVANT reducer', async () =>
    queryDatabase
      .mergeEntity({ commit: newCommit, reducer: faultReducer })
      .then(({ status, message, error }) => {
        expect(status).toEqual('ERROR');
        expect(error.message.startsWith('fail to reduce')).toBeTruthy();
        expect(message).toContain(REDUCE_ERR);
      }));

  it('should merge entity', async () =>
    queryDatabase
      .mergeEntity({ commit: newCommit, reducer })
      .then(({ status, message, result }) => {
        expect(status).toBe('OK');
        expect(result).toEqual([
          { key: 'e:test_proj:qh_proj_test_001', status: 'OK' },
          {
            key: 'c:test_proj:qh_proj_test_001:20200528133520841',
            status: 'OK',
          },
        ]);
      }));

  it('should fail to queryCommitByEntityId: non-exist entityName', async () =>
    queryDatabase
      .queryCommitByEntityId({ entityName: 'ABC', id: ENTITYID })
      .then((result) => expect(result).toEqual(noResult)));

  it('should fail to queryCommitByEntityId: non-exist id', async () =>
    queryDatabase
      .queryCommitByEntityId({ entityName: ENTITYNAME, id: 'DEF' })
      .then((result) => expect(result).toEqual(noResult)));

  it('should queryCommitsBy: entityName and entityId', async () =>
    queryDatabase
      .queryCommitByEntityId({ entityName: ENTITYNAME, id: ENTITYID })
      .then(({ status, message, result }) => {
        expect(status).toBe('OK');
        expect(message).toEqual('2 record(s) returned');
        result.forEach((commit) => expect(isOutputCommit(commit)).toBeTruthy());
      }));

  it('should fail to queryCommitsBy: non-exist entityName', async () =>
    queryDatabase
      .queryCommitByEntityName({ entityName: 'ABC' })
      .then((result) => expect(result).toEqual(noResult)));

  it('should queryCommitsBy: entityName', async () =>
    queryDatabase
      .queryCommitByEntityName({ entityName: ENTITYNAME })
      .then(({ status, message, result }) => {
        expect(status).toBe('OK');
        expect(message).toEqual('2 record(s) returned');
        result.forEach((commit) => expect(isOutputCommit(commit)).toBeTruthy());
      }));

  it('should mergeBatch', async () =>
    queryDatabase
      .mergeEntityBatch({ entityName: ENTITYNAME, reducer, commits })
      .then(({ result, status, message }) => {
        expect(status).toBe('OK');
        expect(result).toEqual([
          { key: 'e:test_proj:qh_proj_test_002', status: 'OK' },
          { key: 'e:test_proj:qh_proj_test_003', status: 'OK' },
        ]);
      }));

  it('should fullTextSearchCommit: qh*', async () =>
    queryDatabase.fullTextSearchCommit({ query: 'qh*' }).then(({ status, result }) => {
      expect(status).toBe('OK');
      (result as any[]).forEach((item) => expect(isOutputCommit(item)).toBeTruthy());
      expect((result as any[]).length).toBe(2);
    }));

  it('should fullTextSearchCommit: return count-only', async () =>
    queryDatabase
      .fullTextSearchCommit({ query: 'qh*', countTotalOnly: true })
      .then(({ status, result }) => {
        expect(status).toBe('OK');
        expect(result).toBe(2);
      }));

  it('should fail to fullTextSearchEntity: invalid character', async () =>
    queryDatabase
      .fullTextSearchEntity({ entityName: ENTITYNAME, query: 'xffd;;;;;df' })
      .then(({ status, error }) => {
        expect(status).toEqual('ERROR');
        // "error": [Error: Redisearch: ReplyError: Syntax error at offset 4 near xffd],
      }));

  it('should fail to fullTextSearchEntity: entityName not found', async () =>
    queryDatabase.fullTextSearchEntity({ entityName: ENTITYNAME, query: 'abc' }).then((result) => {
      expect(result).toEqual({ status: 'OK', message: '0 record(s) returned', result: [] });
    }));

  it('should fail to fullTextSearchEntity by "de": invalid input', async () =>
    queryDatabase
      .fullTextSearchEntity({
        query: 'xyz',
        entityName: ENTITYNAME,
        param: { sortBy: { sort: 'ASC', field: 'de' } },
      })
      .then((result) => expect(result).toEqual(noResult)));

  it('should fail to fullTextSearchEntity by "abc": no such indexed field', async () =>
    queryDatabase
      .fullTextSearchEntity({
        query: 'xyz',
        entityName: ENTITYNAME,
        param: { sortBy: { sort: 'ASC', field: 'abc' } },
      })
      .then(({ status, error }) => {
        expect(status).toBe('ERROR');
        expect(error.message).toContain('not loaded nor in schema');
      }));

  it('should fullTextSearchEntity by "de"', async () =>
    queryDatabase
      .fullTextSearchEntity({
        query: 'handler',
        entityName: ENTITYNAME,
        param: { sortBy: { sort: 'ASC', field: 'de' } },
      })
      .then((result) => expect(result).toMatchSnapshot()));

  it('should fullTextSearchEntity by "de": countTotalOnly', async () =>
    queryDatabase
      .fullTextSearchEntity({
        countTotalOnly: true,
        query: 'handler',
        entityName: ENTITYNAME,
        param: { sortBy: { sort: 'ASC', field: 'de' } },
      })
      .then((result) =>
        expect(result).toEqual({ status: 'OK', message: '3 record(s) returned', result: 3 })
      ));

  // it('should fail to deleteCommitByEntityId with invalid entityName', async () =>
  //   queryDatabase
  //     .deleteCommitByEntityId({ entityName: 'ABC', id: ENTITYID })
  //     .then((result) =>
  //       expect(result).toEqual({ status: 'OK', message: '0 record(s) deleted', result: 0 })
  //     ));
  //
  // it('should deleteCommitByEntityId', async () =>
  //   queryDatabase
  //     .deleteCommitByEntityId({ entityName: ENTITYNAME, id: ENTITYID })
  //     .then((result) =>
  //       expect(result).toEqual({ status: 'OK', message: '2 record(s) deleted', result: 2 })
  //     ));
});
