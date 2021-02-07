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
import { waitForSecond } from '../../utils';
import { REDUCE_ERR } from '../constants';
import { createQueryDatabaseV2 } from '../createQueryDatabaseV2';
import { createRedisRepository } from '../createRedisRepository';
import { isOutputCommit } from '../typeGuard';
import type { QueryDatabaseV2, RedisRepository, OutputCommit } from '../types';
import { commit, commits, faultReducer, newCommit } from './__utils__';

/**
 * running it: .dn-run.0-db-red.sh
 */
let queryDatabase: QueryDatabaseV2;
let client: Redisearch;
let commitRepo: RedisRepository<OutputCommit>;
let counter: RedisRepository<OutputCounter>;

const ENTITYNAME = 'test_proj';
const ENTITYID = 'qh_proj_test_001';
const noResult = { status: 'OK', message: '0 record(s) returned', data: [] };

beforeAll(async () => {
  client = new Redisearch({ host: 'localhost', port: 6379 });

  await client.connect();

  counter = createRedisRepository<Counter, CounterInRedis, OutputCounter>({
    client,
    fields,
    entityName: ENTITYNAME,
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

  const { status } = await queryDatabase.clearNotifications({ creator: 'org1-admin' });
  console.log(`clearNotifications: ${status}`);
});

afterAll(async () => {
  await client.disconnect();
  return waitForSecond(2);
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
    const { data, status } = await queryDatabase.mergeCommit({ commit });
    expect(status).toBe('OK');
    expect(data).toStrictEqual([key]);

    // test the reselected data
    const result = await commitRepo.hgetall(key);
    expect(omit(commit, 'events')).toStrictEqual(
      pick(result, 'id', 'entityName', 'version', 'commitId', 'entityId', 'mspId')
    );
  });

  it('should fail to mergeEntity with IRRELEVANT reducer', async () =>
    queryDatabase
      .mergeEntity({ commit: newCommit, reducer: faultReducer })
      .then(({ status, message, errors }) => {
        expect(status).toEqual('ERROR');
        expect(errors[0].message.startsWith('fail to reduce')).toBeTruthy();
        expect(message).toContain(REDUCE_ERR);
      }));

  it('should merge entity', async () =>
    queryDatabase.mergeEntity({ commit: newCommit, reducer }).then(({ status, data }) => {
      expect(status).toBe('OK');
      expect(data).toEqual([
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
      .then(({ status, message, data }) => {
        expect(status).toBe('OK');
        expect(message).toEqual('2 record(s) returned');
        data.forEach((commit) => expect(isOutputCommit(commit)).toBeTruthy());
      }));

  it('should fail to queryCommitsBy: non-exist entityName', async () =>
    queryDatabase
      .queryCommitByEntityName({ entityName: 'ABC' })
      .then((result) => expect(result).toEqual(noResult)));

  it('should queryCommitsBy: entityName', async () =>
    queryDatabase
      .queryCommitByEntityName({ entityName: ENTITYNAME })
      .then(({ status, message, data }) => {
        expect(status).toBe('OK');
        expect(message).toEqual('2 record(s) returned');
        data.forEach((commit) => expect(isOutputCommit(commit)).toBeTruthy());
      }));

  it('should mergeBatch', async () =>
    queryDatabase
      .mergeEntityBatch({ entityName: ENTITYNAME, reducer, commits })
      .then(({ data, status, message }) => {
        expect(status).toBe('OK');
        expect(data).toEqual([
          { key: 'e:test_proj:qh_proj_test_002', status: 'OK' },
          { key: 'e:test_proj:qh_proj_test_003', status: 'OK' },
        ]);
      }));

  it('should fullTextSearchCommit: qh*', async () =>
    queryDatabase.fullTextSearchCommit({ query: 'qh*' }).then(({ status, data }) => {
      expect(status).toBe('OK');
      (data as any[]).forEach((item) => expect(isOutputCommit(item)).toBeTruthy());
      expect((data as any[]).length).toBe(2);
    }));

  it('should fullTextSearchCommit: return count-only', async () =>
    queryDatabase
      .fullTextSearchCommit({ query: 'qh*', countTotalOnly: true })
      .then(({ status, data }) => {
        expect(status).toBe('OK');
        expect(data).toBe(2);
      }));

  it('should fail to fullTextSearchEntity: invalid character', async () =>
    queryDatabase
      .fullTextSearchEntity({ entityName: ENTITYNAME, query: 'xffd;;;;;df' })
      .then(({ status, errors }) => {
        expect(status).toEqual('ERROR');
        // "error": [Error: Redisearch: ReplyError: Syntax error at offset 4 near xffd],
      }));

  it('should fail to fullTextSearchEntity: entityName not found', async () =>
    queryDatabase.fullTextSearchEntity({ entityName: ENTITYNAME, query: 'abc' }).then((result) => {
      expect(result).toEqual(noResult);
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
      .then(({ status, errors }) => {
        expect(status).toBe('ERROR');
        expect(errors[0].message).toContain('not loaded nor in schema');
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
        expect(result).toEqual({ status: 'OK', message: '3 record(s) returned', data: 3 })
      ));

  it('should fail to getNotifications', async () =>
    queryDatabase
      .getNotificationsByFields({ creator: 'abc' })
      .then((result) => expect(result).toEqual({ status: 'OK', data: [] })));

  it('should getNotifications by creator', async () =>
    queryDatabase.getNotificationsByFields({ creator: 'org1-admin' }).then(({ status, data }) => {
      expect(status).toBe('OK');
      expect(data).toEqual({ 'n:org1-admin:test_proj:qh_proj_test_001:20200528133520841': '1' });
    }));

  it('should getNotifications by creator, entityName', async () =>
    queryDatabase
      .getNotificationsByFields({ creator: 'org1-admin', entityName: ENTITYNAME })
      .then(({ status, data }) => {
        expect(status).toBe('OK');
        expect(data).toEqual({
          'n:org1-admin:test_proj:qh_proj_test_001:20200528133520841': '1',
        });
      }));

  it('should getNotifications by creator, entityName, id', async () =>
    queryDatabase
      .getNotificationsByFields({ creator: 'org1-admin', entityName: ENTITYNAME, id: ENTITYID })
      .then(({ status, data }) => {
        expect(status).toBe('OK');
        expect(data).toEqual({
          'n:org1-admin:test_proj:qh_proj_test_001:20200528133520841': '1',
        });
      }));

  it('should getNotification: return 1, for first time', async () =>
    queryDatabase
      .getNotification({
        creator: 'org1-admin',
        entityName: ENTITYNAME,
        id: ENTITYID,
        commitId: '20200528133520841',
      })
      .then(({ status, data }) => {
        expect(status).toBe('OK');
        expect(data).toEqual({
          'n:org1-admin:test_proj:qh_proj_test_001:20200528133520841': '1',
        });
      }));

  it('should getNotification: return 0, for second time', async () =>
    queryDatabase
      .getNotification({
        creator: 'org1-admin',
        entityName: ENTITYNAME,
        id: ENTITYID,
        commitId: '20200528133520841',
      })
      .then(({ status, data }) => {
        expect(status).toBe('OK');
        expect(data).toEqual({
          'n:org1-admin:test_proj:qh_proj_test_001:20200528133520841': '0',
        });
      }));

  it('should clearNotification: one notification', async () =>
    queryDatabase
      .clearNotification({
        creator: 'org1-admin',
        entityName: ENTITYNAME,
        id: ENTITYID,
        commitId: '20200528133520841',
      })
      .then(({ data, status }) => {
        expect(status).toBe('OK');
        expect(data).toEqual(['n:org1-admin:test_proj:qh_proj_test_001:20200528133520841']);
      }));

  it('should fail to deleteCommitByEntityId with invalid entityName', async () =>
    queryDatabase
      .deleteCommitByEntityId({ entityName: 'ABC', id: ENTITYID })
      .then((result) =>
        expect(result).toEqual({ status: 'OK', message: '0 record(s) deleted', data: 0 })
      ));

  it('should deleteCommitByEntityId', async () =>
    queryDatabase
      .deleteCommitByEntityId({ entityName: ENTITYNAME, id: ENTITYID })
      .then((result) =>
        expect(result).toEqual({ status: 'OK', message: '2 record(s) deleted', data: 2 })
      ));

  it('should deleteEntityByEntityName', async () =>
    queryDatabase
      .deleteEntityByEntityName({ entityName: ENTITYNAME })
      .then((result) =>
        expect(result).toEqual({ status: 'OK', message: '3 record(s) deleted', data: 3 })
      ));
});
