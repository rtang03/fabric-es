require('dotenv').config({ path: './.env.test' });
import { Redisearch } from 'redis-modules-sdk';
import { Store } from 'redux';
import { createQueryDatabase, createRedisRepository } from '../../../queryHandler';
import type { OutputCommit, QueryDatabase, RedisRepository } from '../../../queryHandler/types';
import { getReducer } from '../../../types';
import {
  Counter,
  CounterInRedis,
  counterIndexDefinition as fields,
  OutputCounter,
  postSelector,
  preSelector,
  reducerCallback,
} from '../../../unit-test-counter';
import { dispatcher, getLogger, waitForSecond } from '../../../utils';
import { action as queryAction } from '../../query';
import { action } from '../action';
import { getStore, entityName } from './__utils__';

let client: Redisearch;
let commitRepo: RedisRepository<OutputCommit>;
let counterRedisRepo: RedisRepository<OutputCounter>;
let store: Store;
let queryDatabase: QueryDatabase;

const reducer = getReducer(reducerCallback);
const logger = getLogger({ name: 'reconcile.store.unit-test.ts' });
const reducers = { [entityName]: reducer };
const { reconcile, RECONCILE_SUCCESS, RECONCILE_ERROR } = action;

beforeAll(async () => {
  try {
    // Step 1: connect Redis
    client = new Redisearch({ host: 'localhost', port: 6379 });
    await client.connect();

    // Step 2: create counter's RedisRepo
    Counter.entityName = entityName;
    counterRedisRepo = createRedisRepository<Counter, CounterInRedis, OutputCounter>(
      Counter, {
        client,
        fields,
        postSelector,
        preSelector,
    });

    // Step 3: create QueryDatabase; return commitRepo
    queryDatabase = createQueryDatabase(client, { [entityName]: counterRedisRepo });
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

    // Step 7: clear all pre-existing records
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
  await client.disconnect();
  console.log('Test ends,... quitting');
  return waitForSecond(2);
});

describe('Store/reconcile: failure tests', () => {
  it('should fail to reconcile: invalid argument', async () =>
    dispatcher<null, { entityName: string }>((payload) => reconcile(payload), {
      name: 'reconcile',
      slice: 'reconcile',
      store,
      logger,
      SuccessAction: RECONCILE_SUCCESS,
      ErrorAction: RECONCILE_ERROR,
    })({ entityName: null }).then(({ data, status, error }) => {
      expect(data).toBeNull();
      expect(status).toEqual('ERROR');
      expect(error.message).toContain('invalid input argument');
    }));

  it('should fail to reconcile: no such entityName', async () =>
    dispatcher<any, { entityName: string }>((payload) => reconcile(payload), {
      name: 'reconcile',
      slice: 'reconcile',
      store,
      logger,
      SuccessAction: RECONCILE_SUCCESS,
      ErrorAction: RECONCILE_ERROR,
    })({ entityName: 'noop' }).then((result) => {
      expect(result).toEqual({ status: 'OK', data: [] });
    }));
});
