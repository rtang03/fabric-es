require('dotenv').config({ path: './.env.dev' });
import pick from 'lodash/pick';
import { Redisearch } from 'redis-modules-sdk';
import {
  parseCommitHashFields,
  createCIndex,
  getCommitKey,
  getCommitHashFields,
  CIDX,
  createEIndex,
  getEidxName,
  getEidxPrefix,
  TEST_ENTITYNAME,
} from '..';
import type { QueryDatabase } from '../../types';
import { reducer } from '../../unit-test-reducer';
import { createQueryDatabaseV2 } from '../createQueryDatabaseV2';
import { commit } from './__utils__';

// const key = `${commit.entityName}::${commit.entityId}::${commit.commitId}`;
// const key2 = `test_proj::qh_proj_test_002`;
// const key3 = `test_proj::qh_proj_test_003`;

/**
 * .dn-run.0-db-red.sh
 */
let queryDatabase: QueryDatabase;
let client: Redisearch;
const eIdx = getEidxName(TEST_ENTITYNAME);

beforeAll(async () => {
  client = new Redisearch({ host: 'localhost', port: 6379 });

  await client.connect();

  queryDatabase = createQueryDatabaseV2(client);

  // prepare eidx
  await client
    .dropindex(eIdx, true)
    .then((result) => console.log(`${eIdx} is dropped: ${result}`))
    .catch((result) => console.log(`${eIdx} is not dropped: ${result}`));

  await createEIndex(client, {
    param: { prefix: [{ count: 1, name: getEidxPrefix(TEST_ENTITYNAME) }] },
  })
    .then((result) => console.log(`${eIdx} is created: ${result}`))
    .catch((result) => {
      console.log(`${eIdx} is not created: ${result}`);
      process.exit(1);
    });

  // prepare cidx
  await client
    .dropindex(CIDX, true)
    .then((result) => console.log(`${CIDX} is dropped: ${result}`))
    .catch((result) => console.log(`${CIDX} is not dropped: ${result}`));

  await createCIndex(client)
    .then((result) => console.log(`${CIDX} is created: ${result}`))
    .catch((result) => {
      console.log(`${CIDX} is not created: ${result}`);
      process.exit(1);
    });
});

afterAll(async () => {
  await client
    .dropindex(eIdx, true)
    .then((result) => console.log(`${eIdx} is dropped: ${result}`))
    .catch((result) => console.log(`${eIdx} is not dropped: ${result}`));

  await client.disconnect();
});

describe('Projecion db test', () => {
  // first commit for merge test
  it('should merge commit', async () => {
    const { result, status } = await queryDatabase.mergeCommit({ commit });
    expect(status).toBe('OK');
    expect(result).toStrictEqual([getCommitKey(commit)]);

    const data = await client.redis.hgetall(getCommitKey(commit));
    // this test validate parseCommitHashFields can revert to original format.
    expect(
      pick(commit, 'id', 'mspId', 'entityName', 'version', 'events', 'commitId')
    ).toStrictEqual(
      pick(
        parseCommitHashFields(data),
        'id',
        'mspId',
        'entityName',
        'version',
        'events',
        'commitId'
      )
    );
  });
});
