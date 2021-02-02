import { isOutputCommit } from '../typeGuard';

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
import { createQueryDatabaseV2 } from '../createQueryDatabaseV2';
import { createRedisRepository } from '../createRedisRepository';
import type { QueryDatabaseV2, RedisRepository, OutputCommit } from '../types';
import { commit, faultReducer, newCommit } from './__utils__';
import { REDUCE_ERR } from '../constants';

// const key = `${commit.entityName}::${commit.entityId}::${commit.commitId}`;
// const key2 = `test_proj::qh_proj_test_002`;
// const key3 = `test_proj::qh_proj_test_003`;

/**
 * running it: .dn-run.0-db-red.sh
 */
let queryDatabase: QueryDatabaseV2;
let client: Redisearch;
let commitRepo: RedisRepository<OutputCommit>;
let counter: RedisRepository<any>;

const ENTITYNAME = 'test_proj';
const ENTITYID = 'qh_proj_test_001';

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
});

describe('Projecion db test', () => {
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

  it('should queryCommitsBy: entityNamd and entityId', async () =>
    queryDatabase
      .queryCommitByEntityId({ entityName: ENTITYNAME, id: ENTITYID })
      .then(({ status, message, result }) => {
        expect(status).toBe('OK');
        expect(message).toEqual('2 record(s) returned');
        result.forEach((commit) => expect(isOutputCommit(commit)).toBeTruthy());
      }));

  it('should queryCommitsBy: entityName', async () =>
    queryDatabase
      .queryCommitByEntityName({ entityName: ENTITYNAME })
      .then(({ status, message, result }) => {
        expect(status).toBe('OK');
        expect(message).toEqual('2 record(s) returned');
        result.forEach((commit) => expect(isOutputCommit(commit)).toBeTruthy());
      }));
});
