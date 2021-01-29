require('dotenv').config({ path: './.env.dev' });
import omit from 'lodash/omit';
import pick from 'lodash/pick';
import { Redisearch } from 'redis-modules-sdk';
import { reducer } from '../../unit-test-reducer';
import { createQueryDatabaseV2 } from '../createQueryDatabaseV2';
import { createRedisRepository } from '../createRedisRepository';
import { redisCommit, restoreCommit } from '../model';
import type { QueryDatabaseV2, RedisRepository } from '../types';
import { commit } from './__utils__';

// const key = `${commit.entityName}::${commit.entityId}::${commit.commitId}`;
// const key2 = `test_proj::qh_proj_test_002`;
// const key3 = `test_proj::qh_proj_test_003`;

/**
 * .dn-run.0-db-red.sh
 */
let queryDatabase: QueryDatabaseV2;
let client: Redisearch;
let redisCommitRepo: RedisRepository;
const TEST_ENTITYNAME = 'test_proj';

beforeAll(async () => {
  client = new Redisearch({ host: 'localhost', port: 6379 });

  await client.connect();

  redisCommitRepo = createRedisRepository({
    client,
    kind: 'commit',
    fields: redisCommit,
    restore: restoreCommit,
  });
  queryDatabase = createQueryDatabaseV2({ commit: redisCommitRepo });

  // // prepare eidx
  // await client
  //   .dropindex(eIdx, true)
  //   .then((result) => console.log(`${eIdx} is dropped: ${result}`))
  //   .catch((result) => console.log(`${eIdx} is not dropped: ${result}`));
  //
  // await createEIndex(client, {
  //   param: { prefix: [{ count: 1, name: getEidxPrefix(TEST_ENTITYNAME) }] },
  // })
  //   .then((result) => console.log(`${eIdx} is created: ${result}`))
  //   .catch((result) => {
  //     console.log(`${eIdx} is not created: ${result}`);
  //     process.exit(1);
  //   });

  const cidx = redisCommitRepo.getIndexName();

  await redisCommitRepo
    .dropIndex()
    .then((result) => console.log(`${cidx} is dropped: ${result}`))
    .catch((result) => console.log(`${cidx} is not dropped: ${result}`));

  await redisCommitRepo
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
    const key = redisCommitRepo.getKey(commit);
    const { result, status } = await queryDatabase.mergeCommit({ commit });
    expect(status).toBe('OK');
    expect(result).toStrictEqual([key]);

    const data = await redisCommitRepo.hgetall(key);
    expect(omit(commit, 'events')).toStrictEqual(
      pick(data, 'id', 'entityName', 'version', 'commitId', 'entityId', 'mspId')
    );
  });
});
