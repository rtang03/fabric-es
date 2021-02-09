require('dotenv').config({ path: './.env.test' });
import { Redisearch } from 'redis-modules-sdk';
import { Store } from 'redux';
import { commitsToGroupByEntityId } from '../../../queryHandler';
import { createQueryDatabaseV2, createRedisRepository } from '../../../queryHandlerV2';
import type {
  GetByEntityNameResponse,
  OutputCommit,
  QueryDatabaseV2,
  RedisRepository,
} from '../../../queryHandlerV2/types';
import type { Commit } from '../../../types';
import {
  Counter,
  CounterInRedis,
  counterSearchDefinition as fields,
  OutputCounter,
  postSelector,
  preSelector,
  reducer,
} from '../../../unit-test-reducer';
import { dispatcher, getLogger, waitForSecond } from '../../../utils';
import { action, action as queryAction } from '../action';
import { commit, entityName, newCommit } from './__utils__';
import { getStore } from './__utils__/storeV2';

let client: Redisearch;
let commitRepo: RedisRepository<OutputCommit>;
let counterRedisRepo: RedisRepository<OutputCounter>;
let store: Store;
let queryDatabase: QueryDatabaseV2;

const logger = getLogger({ name: 'query.store.unit-test.ts' });
const {
  deleteCommitByEntityName,
  deleteCommitByEntityId,
  DELETE_SUCCESS,
  DELETE_ERROR,
  mergeCommit,
  mergeCommitBatch,
  MERGE_COMMIT_SUCCESS,
  MERGE_COMMIT_ERROR,
  MERGE_COMMIT_BATCH_SUCCESS,
  MERGE_COMMIT_BATCH_ERROR,
  queryByEntityName,
  queryByEntityId,
  QUERY_SUCCESS,
  QUERY_ERROR,
} = action;
const reducers = { [entityName]: reducer };
const id = 'test_001';

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
    await dispatcher<number, { entityName: string }>(
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
      .then(({ data }) => console.log(`${data} record(s) deleted`))
      .catch((error) => console.error(error.message));

    // clear all pre-existing records
    await queryDatabase
      .deleteCommitByEntityName({ entityName })
      .then(({ message }) => console.log(message))
      .catch((result) => console.log(result));

    await queryDatabase
      .deleteEntityByEntityName({ entityName })
      .then(({ message }) => console.log(message))
      .catch((result) => console.log(result));

    await queryDatabase
      .clearNotifications({ creator: 'org1-admin' })
      .then(({ status }) => console.log(`clearNotifications: ${status}`));
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
});

afterAll(async () => {
  // await queryDatabase
  //   .deleteCommitByEntityName({ entityName })
  //   .then(({ message }) => console.log(message))
  //   .catch((result) => console.log(result));
  //
  // await queryDatabase
  //   .deleteEntityByEntityName({ entityName })
  //   .then(({ message }) => console.log(message))
  //   .catch((result) => console.log(result));
  //
  // await queryDatabase
  //   .clearNotifications({ creator: 'org1-admin' })
  //   .then(({ status }) => console.log(`clearNotifications: ${status}`));

  await client.disconnect();
  console.log('Test ends,... quitting');
  return waitForSecond(2);
});

describe('Store/query: failure tests', () => {
  it('should queryByEntityName with no result returned', async () =>
    dispatcher<GetByEntityNameResponse<Counter>, { entityName: string }>(
      (payload) => queryByEntityName(payload),
      {
        name: 'queryByEntityName',
        store,
        slice: 'query',
        SuccessAction: QUERY_SUCCESS,
        ErrorAction: QUERY_ERROR,
        logger,
      },
      (commits: OutputCommit[]) => commitsToGroupByEntityId<Counter>(commits, reducers[entityName])
    )({ entityName }).then((result) => {
      console.log(result);
      expect(result).toEqual({ status: 'OK', data: { currentStates: [], errors: [] } });
    }));

  // it('should', async () => {});
});

describe('Store/query Test', () => {
  it('should #1 mergeCommit', async () =>
    dispatcher<string[], { commit: Commit }>((payload) => mergeCommit(payload), {
      name: 'mergeCommit',
      store,
      slice: 'query',
      SuccessAction: MERGE_COMMIT_SUCCESS,
      ErrorAction: MERGE_COMMIT_ERROR,
      logger,
    })({ commit }).then(({ data, status }) => {
      expect(data[0]).toContain('c:store_query:test_001:');
      expect(status).toEqual('OK');
    }));

  // step 1. retrieve OutputCommit[] by entityName
  // step 2. group by entityId
  // step. 3. compute back to entity, reducers. It does NOT store the computed result, back to Redis
  // step 1 returns OutputCommit
  // [
  //   {
  //     id: 'test_001',
  //     entityName: 'store_query',
  //     commitId: '20200528133519841',
  //     mspId: 'Org1MSP',
  //     creator: 'org1-admin',
  //     event: 'Increment',
  //     entityId: 'test_001',
  //     version: 0,
  //     ts: 1590738792,
  //     events: [ [Object] ]
  //   }
  // ]
  // step 3 returns Counter, but NOT CounterInRedis / OutputCounter
  // [
  //   {
  //     id: 'test_001',
  //     desc: 'store #1',
  //     tag: 'store,query',
  //     value: 1,
  //     _ts: 1590738792,
  //     _created: 1590738792,
  //     _creator: 'org1-admin'
  //   }
  // ]
  it('should queryByEntityName: return counter.value = 1', async () =>
    dispatcher<GetByEntityNameResponse<Counter>, { entityName: string }>(
      (payload) => queryByEntityName(payload),
      {
        name: 'queryByEntityName',
        store,
        slice: 'query',
        SuccessAction: QUERY_SUCCESS,
        ErrorAction: QUERY_ERROR,
        logger,
      },
      (commits: OutputCommit[]) =>
        commits ? commitsToGroupByEntityId<Counter>(commits, reducers[entityName]) : null
    )({ entityName }).then(({ status, data: { currentStates, errors } }) => {
      expect(status).toEqual('OK');
      expect(errors).toEqual([]);
      expect(currentStates[0].value).toEqual(1);
      expect(currentStates[0].id).toEqual(id);
    }));

  it('should queryByEntityId', async () =>
    dispatcher<OutputCommit[], { entityName: string; id: string }>(
      (payload) => queryByEntityId(payload),
      {
        name: 'queryByEntityId',
        store,
        slice: 'query',
        SuccessAction: QUERY_SUCCESS,
        ErrorAction: QUERY_ERROR,
        logger,
      },
      (result) => (result ? Object.values<OutputCommit>(result).reverse() : null)
    )({ entityName, id }).then(({ data, status }) => {
      // in previous step, "mergeCommit", the raw Commit appends a derived fields,
      // creator, event, and ts, resulting OutputCommit
      const mockedOutputCommit = Object.assign({}, commit, {
        creator: 'org1-admin',
        event: 'Increment',
        ts: 1590738792,
      });
      expect(data).toEqual([mockedOutputCommit]);
      expect(status).toEqual('OK');
    }));

  it('should #2 mergeCommit', async () =>
    dispatcher<string[], { commit: Commit }>((payload) => mergeCommit(payload), {
      name: 'mergeCommit',
      store,
      slice: 'query',
      SuccessAction: MERGE_COMMIT_SUCCESS,
      ErrorAction: MERGE_COMMIT_ERROR,
      logger,
    })({ commit: newCommit }).then(({ data, status }) => {
      expect(data[0]).toContain('c:store_query:test_001:');
      expect(status).toEqual('OK');
    }));

  it('should #2 queryByEntityName: return 1 counter', async () =>
    dispatcher<GetByEntityNameResponse<Counter>, { entityName: string }>(
      (payload) => queryByEntityName(payload),
      {
        name: 'queryByEntityName',
        store,
        slice: 'query',
        SuccessAction: QUERY_SUCCESS,
        ErrorAction: QUERY_ERROR,
        logger,
      },
      (commits) =>
        commits ? commitsToGroupByEntityId<Counter>(commits, reducers[entityName]) : null
    )({ entityName }).then(({ status, data: { currentStates, errors } }) => {
      expect(status).toEqual('OK');
      expect(errors).toEqual([]);
      expect(currentStates[0].value).toEqual(2);
      expect(currentStates[0].id).toEqual(id);
    }));
});
