require('dotenv').config({ path: './.env.dev' });
import { Redisearch } from 'redis-modules-sdk';
import type { QueryDatabase } from '../../types';
import { reducer } from '../../unit-test-reducer';
import { createQueryDatabaseV2 } from '../createQueryDatabaseV2';
import { commit } from './__utils__';

const key = `${commit.entityName}::${commit.entityId}::${commit.commitId}`;
const key2 = `test_proj::qh_proj_test_002`;
const key3 = `test_proj::qh_proj_test_003`;

/**
 * .dn-run.0-db-red.sh
 */
let queryDatabase: QueryDatabase;
let client: Redisearch;

beforeAll(async () => {
  client = new Redisearch({ host: 'localhost', port: 6379 });

  await client.connect();

  queryDatabase = createQueryDatabaseV2(client);

  // prepare eidx
  await client
    .dropindex('eidx', true)
    .then((result) => console.log(`entityIndex is dropped: ${result}`))
    .catch((result) => console.log(`entityIndex is not dropped: ${result}`));
});

afterAll(async () => {
  await client.disconnect();
});

describe('redis test', () => {
  it('should run redis', async () => {
    return true;
  });
});
