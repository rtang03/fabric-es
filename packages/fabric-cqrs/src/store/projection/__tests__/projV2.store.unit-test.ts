require('dotenv').config({ path: './.env.test' });
import { Redisearch } from 'redis-modules-sdk';
import { Store } from 'redux';
import { createQueryDatabaseV2, createRedisRepository } from '../../../queryHandlerV2';
import type { OutputCommit, QueryDatabaseV2, RedisRepository } from '../../../queryHandlerV2/types';
import type { Commit, HandlerResponse } from '../../../types';
import {
  Counter,
  CounterInRedis,
  counterSearchDefinition as fields,
  OutputCounter,
  postSelector,
  preSelector,
  reducer,
} from '../../../unit-test-reducer';
import { dispatcher, getLogger, isCommitRecord, waitForSecond } from '../../../utils';
import { action as queryAction } from '../../query';
import { action as projAction, action } from '../action';
import { commit, commits, newCommit, entityName } from './__utils__/data';
import { getStore } from './__utils__/storeV2';

let client: Redisearch;
let commitRepo: RedisRepository<OutputCommit>;
let counterRedisRepo: RedisRepository<OutputCounter>;
let store: Store;
let queryDatabase: QueryDatabaseV2;

const logger = getLogger({ name: 'proj.store.unit-test.ts' });
const reducers = { [entityName]: reducer };
const id = 'test_001';
const {
  mergeEntity,
  mergeEntityBatch,
  MERGE_ENTITY_ERROR,
  MERGE_ENTITY_SUCCESS,
  MERGE_ENTITY_BATCH_ERROR,
  MERGE_ENTITY_BATCH_SUCCESS,
} = action;

beforeAll(async () => {
  try {
    // Step 1: connect Redis
    client = new Redisearch({ host: 'localhost', port: 6379 });
    await client.connect();

    // Step 2: create counter's RedisRepo
    counterRedisRepo = createRedisRepository<Counter, CounterInRedis, OutputCounter>({
      client,
      fields,
      entityName,
      postSelector,
      preSelector,
    });

    // Step 3: create QueryDatabase; return commitRepo
    queryDatabase = createQueryDatabaseV2(client, { [entityName]: counterRedisRepo });
    commitRepo = queryDatabase.getRedisCommitRepo();

    // Step 4: redux store
    store = getStore({ queryDatabase, reducers, logger });

    // Step 5: prepare Redisearch indexes
    const eidx = counterRedisRepo.getIndexName();
    await counterRedisRepo
      .dropIndex()
      .then((result) => console.log(`${eidx} is dropped: ${result}`))
      .catch((result) => console.log(`${eidx} is not dropped: ${result}`));

    await counterRedisRepo
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

    // Step 6: delete all query-side commits by entityName
    await dispatcher<HandlerResponse, { entityName: string }>(
      (payload) => queryAction.deleteCommitByEntityName(payload),
      {
        name: 'deleteByEntityName',
        store,
        slice: 'query',
        SuccessAction: queryAction.DELETE_SUCCESS,
        ErrorAction: queryAction.DELETE_ERROR,
        logger,
      }
    )({ entityName })
      .then(({ data }) => console.log(data.message))
      .catch((error) => console.error(error.message));
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
});

afterAll(async () => {
  await queryDatabase
    .deleteCommitByEntityName({ entityName })
    .then(({ message }) => console.log(message))
    .catch((result) => console.log(result));

  await queryDatabase
    .deleteEntityByEntityName({ entityName })
    .then(({ message }) => console.log(message))
    .catch((result) => console.log(result));

  await client.disconnect();
  console.log('Test ends,... quitting');
  return waitForSecond(2);
});

describe('Store/projection: failure tests', () => {
  it('should fail to mergeEntity: invalid argument: missing commit', async () =>
    dispatcher<{ key: string; status: string }, { commit: Commit }>(
      (payload) => mergeEntity(payload),
      {
        name: 'merge_one_entity',
        store,
        slice: 'projection',
        SuccessAction: MERGE_ENTITY_SUCCESS,
        ErrorAction: MERGE_ENTITY_ERROR,
        logger,
      }
    )({ commit: null }).then(({ data, status, error }) => {
      expect(data).toBeNull();
      expect(status).toEqual('ERROR');
      expect(error.message).toContain('invalid input argument');
    }));

  it('should fail to mergeEntityBatch: invalid argument: missing commits', async () =>
    dispatcher<null, { entityName: string; commits: Record<string, Commit> }>(
      (payload) => mergeEntityBatch(payload),
      {
        name: 'merge_entity_batch',
        store,
        slice: 'projection',
        SuccessAction: MERGE_ENTITY_BATCH_SUCCESS,
        ErrorAction: MERGE_ENTITY_BATCH_ERROR,
        logger,
      }
    )({ entityName, commits: null }).then(({ data, status, error }) => {
      expect(data).toBeNull();
      expect(status).toEqual('ERROR');
      expect(error.message).toContain('invalid input argument');
    }));

  it('should fail to mergeEntityBatch: invalid argument: missing entityName', async () =>
    dispatcher<null, { entityName: string; commits: Record<string, Commit> }>(
      (payload) => mergeEntityBatch(payload),
      {
        name: 'merge_entity_batch',
        store,
        slice: 'projection',
        SuccessAction: MERGE_ENTITY_BATCH_SUCCESS,
        ErrorAction: MERGE_ENTITY_BATCH_ERROR,
        logger,
      }
    )({ entityName: null, commits }).then(({ data, status, error }) => {
      expect(data).toBeNull();
      expect(status).toEqual('ERROR');
      expect(error.message).toContain('invalid input argument');
    }));

  it('should fail to mergeEntityBatch: invalid argument: empty commits', async () =>
    dispatcher<null, { entityName: string; commits: Record<string, Commit> }>(
      (payload) => mergeEntityBatch(payload),
      {
        name: 'merge_entity_batch',
        store,
        slice: 'projection',
        SuccessAction: MERGE_ENTITY_BATCH_SUCCESS,
        ErrorAction: MERGE_ENTITY_BATCH_ERROR,
        logger,
      }
    )({ entityName, commits: {} }).then(({ data, status }) => {
      expect(data).toBeNull();
      expect(status).toEqual('OK');
    }));

});
