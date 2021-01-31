require('dotenv').config({ path: './.env.dev' });
import omit from 'lodash/omit';
import pick from 'lodash/pick';
import { Redisearch } from 'redis-modules-sdk';
import type { FTCreateParameters } from 'redis-modules-sdk';
import {
  Counter,
  reducer,
  counterSearchDefinition as fields,
  CounterInRedis,
} from '../../unit-test-reducer';
import { createQueryDatabaseV2 } from '../createQueryDatabaseV2';
import { createRedisRepository } from '../createRedisRepository';
import type { QueryDatabaseV2, RedisRepository, OutputCommit } from '../types';
import { commit, newCommit } from './__utils__';

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

const TEST_ENTITYNAME = 'test_proj';

beforeAll(async () => {
  client = new Redisearch({ host: 'localhost', port: 6379 });

  await client.connect();

  counter = createRedisRepository<Counter, CounterInRedis, any>({
    client,
    fields,
  });

  queryDatabase = createQueryDatabaseV2(client, { counter });
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
  it('should merge entity', async () => {
    const result = await queryDatabase.mergeEntity({ commit: newCommit, reducer });
  });
});
