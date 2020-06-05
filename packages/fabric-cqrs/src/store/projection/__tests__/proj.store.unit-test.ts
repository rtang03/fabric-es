require('dotenv').config({ path: './.env.test' });
import Redis from 'ioredis';
import { Store } from 'redux';
import type { Commit, QueryDatabase, QueryDatabaseResponse } from '../../../types';
import { dispatcher, getLogger, isCommitRecord } from '../../../utils';
import {
  commitIndex,
  createQueryDatabase,
  dummyReducer,
  entityIndex,
} from '../../../queryHandler';
import { action as queryAction } from '../../query';
import { action as projAction, action } from '../action';
import { commit, commits, newCommit, entityName } from './__utils__/data';
import { getStore } from './__utils__/store';

let store: Store;
let redis: Redis.Redis;
let queryDatabase: QueryDatabase;
const logger = getLogger({ name: 'proj.store.unit-test.ts' });
const reducers = { [entityName]: dummyReducer };
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
  redis = new Redis();
  queryDatabase = createQueryDatabase(redis);
  store = getStore({ queryDatabase, reducers, logger });

  await dispatcher<QueryDatabaseResponse, { entityName: string }>(
    (payload) => queryAction.deleteByEntityName(payload),
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

  await redis
    .send_command('FT.DROP', ['cidx'])
    .then((result) => console.log(`cidx is dropped: ${result}`))
    .catch((result) => console.log(`cidx is not dropped: ${result}`));

  await redis
    .send_command('FT.DROP', ['eidx'])
    .then((result) => console.log(`eidx is dropped: ${result}`))
    .catch((result) => console.log(`eidx is not dropped: ${result}`));
});

afterAll(async () => {
  await redis
    .send_command('FT.DROP', ['cidx'])
    .then((result) => console.log(`cidx is dropped: ${result}`))
    .catch((result) => console.log(`cidx is not dropped: ${result}`));

  await redis
    .send_command('FT.DROP', ['eidx'])
    .then((result) => console.log(`eidx is dropped: ${result}`))
    .catch((result) => console.log(`eidx is not dropped: ${result}`));

  await queryDatabase
    .deleteCommitByEntityName({ entityName })
    .then(({ message }) => console.log(message))
    .catch((result) => console.log(result));

  return new Promise((done) => setTimeout(() => done(), 2000));
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
      expect(error).toContain('invalid input argument');
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
      expect(error).toContain('invalid input argument');
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
      expect(error).toContain('invalid input argument');
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

describe('Store/query Test', () => {
  beforeAll(async () => {
    await redis
      .send_command('FT.CREATE', commitIndex)
      .then((result) => console.log(`cidx is created: ${result}`))
      .catch((result) => console.error(`cidx is not created: ${result}`));

    await redis
      .send_command('FT.CREATE', entityIndex)
      .then((result) => console.log(`eidx is created: ${result}`))
      .catch((result) => console.error(`eidx is not created: ${result}`));

    await dispatcher<number, { entityName: string }>(
      (payload) => queryAction.deleteByEntityName(payload),
      {
        name: 'deleteByEntityName',
        store,
        slice: 'query',
        SuccessAction: queryAction.DELETE_SUCCESS,
        ErrorAction: queryAction.DELETE_ERROR,
        logger,
      }
    )({ entityName }).then(({ status, data }) =>
      console.log(`entityName: ${entityName} ${data} record(s) is deleted: ${status}`)
    );
  });

  it('should query:mergeCommit: first commit', async () =>
    dispatcher<string[], { commit: Commit }>((payload) => queryAction.mergeCommit(payload), {
      name: 'query:mergeCommit',
      store,
      slice: 'query',
      SuccessAction: queryAction.MERGE_COMMIT_SUCCESS,
      ErrorAction: queryAction.MERGE_COMMIT_ERROR,
      logger,
    })({ commit }).then(({ status, data }) => {
      expect(data).toEqual(['store_projection::test_001::20200528133519841']);
      expect(status).toEqual('OK');
    }));

  it('should projection:mergeEntity: add newCommit', async () =>
    dispatcher<{ key: string; status: string }[], { commit: Commit }>(
      (payload) => projAction.mergeEntity(payload),
      {
        name: 'projection:mergeEntity',
        store,
        slice: 'projection',
        logger,
        SuccessAction: projAction.MERGE_ENTITY_SUCCESS,
        ErrorAction: projAction.MERGE_ENTITY_ERROR,
      }
    )({ commit: newCommit }).then(({ data, status }) => {
      expect(status).toEqual('OK');
      expect(data).toEqual([
        { key: 'store_projection::test_001', status: 'OK' },
        {
          key: 'store_projection::test_001::20200528133520842',
          status: 'OK',
        },
        { key: 'eidx::store_projection::test_001', status: 'OK' },
        { key: 'cidx::store_projection::test_001::20200528133520842', status: 'OK' },
      ]);
    }));

  it('should query:queryByEntityId: verify test_001', async () =>
    dispatcher<Record<string, Commit>, { entityName: string; id: string }>(
      (payload) => queryAction.queryByEntityId(payload),
      {
        name: 'query:queryByEntityId',
        store,
        slice: 'query',
        logger,
        SuccessAction: queryAction.QUERY_SUCCESS,
        ErrorAction: queryAction.QUERY_ERROR,
      }
    )({ entityName, id }).then(({ data, status }) => {
      expect(status).toEqual('OK');
      expect(Object.keys(data).length).toEqual(2);
      expect(isCommitRecord(data)).toBeTruthy();
    }));

  it('should projection:mergeEntityBatch', async () =>
    dispatcher<
      { key: string; status: string }[],
      { entityName: string; commits: Record<string, Commit> }
    >((payload) => projAction.mergeEntityBatch(payload), {
      name: 'projection:mergeEntityBatch',
      store,
      slice: 'projection',
      logger,
      SuccessAction: projAction.MERGE_ENTITY_BATCH_SUCCESS,
      ErrorAction: projAction.MERGE_ENTITY_BATCH_ERROR,
    })({ entityName, commits }).then(({ status, data }) => {
      expect(status).toEqual('OK');
      expect(data).toEqual([
        { key: 'store_projection::test_002', status: 'OK' },
        { key: 'store_projection::test_003', status: 'OK' },
      ]);
    }));
});
