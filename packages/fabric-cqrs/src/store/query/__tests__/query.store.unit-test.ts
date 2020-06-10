require('dotenv').config({ path: './.env.test' });
import Redis from 'ioredis';
import { Store } from 'redux';
import {
  createQueryDatabase,
  dummyReducer,
  Counter,
  commitsToGroupByEntityId,
  commitIndex,
} from '../../../queryHandler';
import type {
  Commit,
  GetByEntityNameResponse,
  QueryDatabase,
  QueryDatabaseResponse,
  HandlerResponse,
} from '../../../types';
import { dispatcher, getLogger } from '../../../utils';
import { action } from '../action';
import { commit, commits, newCommit, entityName } from './__utils__/data';
import { getStore } from './__utils__/store';

let store: Store;
let redis: Redis.Redis;
let queryDatabase: QueryDatabase;

const logger = getLogger({ name: 'query.store.unit-test.ts' });
const {
  deleteByEntityName,
  deleteByEntityId,
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
const reducers = { [entityName]: dummyReducer };
const id = 'test_001';

beforeAll(async () => {
  redis = new Redis();
  queryDatabase = createQueryDatabase(redis);
  store = getStore({ queryDatabase, reducers, logger });

  // tear up
  await dispatcher<QueryDatabaseResponse, { entityName: string }>(
    (payload) => deleteByEntityName(payload),
    {
      name: 'deleteByEntityName',
      store,
      slice: 'query',
      SuccessAction: DELETE_SUCCESS,
      ErrorAction: DELETE_ERROR,
      logger,
    }
  )({ entityName })
    .then(({ data }) => console.log(data.message))
    .catch((error) => console.log(error.message));

  await redis
    .send_command('FT.DROP', ['cidx'])
    .then((result) => console.log(`cidx is dropped: ${result}`))
    .catch((result) => console.log(`cidx is not dropped: ${result}`));
});

afterAll(async () => {
  await redis
    .send_command('FT.DROP', ['cidx'])
    .then((result) => console.log(`cidx is dropped: ${result}`))
    .catch((result) => console.log(`cidx is not dropped: ${result}`));

  await queryDatabase
    .deleteCommitByEntityName({ entityName })
    .then(({ message }) => console.log(message))
    .catch((result) => console.log(result));

  return new Promise((done) => setTimeout(() => done(), 2000));
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
      (commits) => commitsToGroupByEntityId<Counter>(commits, reducers[entityName])
    )({ entityName }).then((result) =>
      expect(result).toEqual({ status: 'OK', data: { currentStates: [], errors: [] } })
    ));

  it('should fail to queryByEntityName: invalid argument', async () =>
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
      (commits) => commitsToGroupByEntityId<Counter>(commits, reducers[entityName])
    )({ entityName: null }).then(({ data, error, status }) => {
      expect(data).toBeNull();
      expect(status).toEqual('ERROR');
      expect(error).toContain('invalid input argument');
    }));

  it('should fail to queryByEntityId: invalid argument', async () =>
    dispatcher<Commit[], { entityName: string; id: string }>(
      (payload) => queryByEntityId(payload),
      {
        name: 'queryByEntityId',
        store,
        slice: 'query',
        SuccessAction: QUERY_SUCCESS,
        ErrorAction: QUERY_ERROR,
        logger,
      },
      (result) => Object.values<Commit>(result).reverse()
    )({ entityName, id: null }).then(({ data, status, error }) => {
      expect(data).toBeNull();
      expect(status).toEqual('ERROR');
      expect(error).toContain('invalid input argument');
    }));

  it('should fail to mergeCommit: invalid argument', async () =>
    dispatcher<HandlerResponse, { commit: Commit }>((payload) => mergeCommit(payload), {
      name: 'mergeCommit',
      store,
      slice: 'query',
      SuccessAction: MERGE_COMMIT_SUCCESS,
      ErrorAction: MERGE_COMMIT_ERROR,
      logger,
    })({ commit: null }).then(({ status, data, error }) => {
      expect(data).toBeNull();
      expect(status).toEqual('ERROR');
      expect(error).toContain('invalid input argument');
    }));

  it('should fail to mergeCommitBatch: invalid argument', async () =>
    dispatcher<HandlerResponse, { entityName: string; commits: Commit }>(
      (payload) => mergeCommitBatch(payload),
      {
        name: 'mergeBatchCommit',
        store,
        slice: 'query',
        SuccessAction: MERGE_COMMIT_BATCH_SUCCESS,
        ErrorAction: MERGE_COMMIT_BATCH_ERROR,
        logger,
      }
    )({ entityName, commits: null }).then(({ status, data, error }) => {
      expect(data).toBeNull();
      expect(status).toEqual('ERROR');
      expect(error).toContain('invalid input argument');
    }));

  it('should fail to deleteByEntityId: invalid argument', async () =>
    dispatcher<QueryDatabaseResponse, { entityName: string; id: string }>(
      (payload) => deleteByEntityId(payload),
      {
        name: 'deleteByEntityId',
        store,
        slice: 'query',
        SuccessAction: DELETE_SUCCESS,
        ErrorAction: DELETE_ERROR,
        logger,
      }
    )({ entityName, id: null }).then(({ status, data, error }) => {
      expect(data).toBeNull();
      expect(status).toEqual('ERROR');
      expect(error).toContain('invalid input argument');
    }));

  it('should fail to deleteByEntityName: invalid argument', async () =>
    dispatcher<QueryDatabaseResponse, { entityName: string }>(
      (payload) => deleteByEntityName(payload),
      {
        name: 'deleteByEntityName',
        store,
        slice: 'query',
        SuccessAction: DELETE_SUCCESS,
        ErrorAction: DELETE_ERROR,
        logger,
      }
    )({ entityName: null }).then(({ status, data, error }) => {
      expect(data).toBeNull();
      expect(status).toEqual('ERROR');
      expect(error).toContain('invalid input argument');
    }));

  it('should fail to mergeCommit, where cidx is not exist', async () =>
    dispatcher<string[], { commit: Commit }>((payload) => mergeCommit(payload), {
      name: 'mergeCommit',
      store,
      slice: 'query',
      SuccessAction: MERGE_COMMIT_SUCCESS,
      ErrorAction: MERGE_COMMIT_ERROR,
      logger,
    })({ commit }).then(({ status, data, error }) => {
      expect(data).toBeNull();
      expect(status).toEqual('ERROR');
      expect(error).toContain('Unknown index name');
    }));

  it('should fail to mergeCommitBatch, where cidx is not exist', async () =>
    dispatcher<string[], { entityName: string; commits: Record<string, Commit> }>(
      (payload) => mergeCommitBatch(payload),
      {
        name: 'mergeBatchCommit',
        store,
        slice: 'query',
        SuccessAction: MERGE_COMMIT_BATCH_SUCCESS,
        ErrorAction: MERGE_COMMIT_BATCH_ERROR,
        logger,
      }
    )({ entityName, commits }).then(({ status, data, error }) => {
      expect(data).toBeNull();
      expect(status).toEqual('ERROR');
      expect(error).toContain('Unknown index name');
    }));
});

describe('Store/query Test', () => {
  beforeAll(async () =>
    redis
      .send_command('FT.CREATE', commitIndex)
      .then((result) => console.log(`cidx is created: ${result}`))
      .catch((result) => console.error(`cidx is not created: ${result}`))
  );

  it('should #1 mergeCommit', async () =>
    dispatcher<string[], { commit: Commit }>((payload) => mergeCommit(payload), {
      name: 'mergeCommit',
      store,
      slice: 'query',
      SuccessAction: MERGE_COMMIT_SUCCESS,
      ErrorAction: MERGE_COMMIT_ERROR,
      logger,
    })({ commit }).then(({ data, status }) => {
      expect(data[0]).toContain('store_query::test_001::');
      expect(status).toEqual('OK');
    }));

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
      (commits) =>
        commits ? commitsToGroupByEntityId<Counter>(commits, reducers[entityName]) : null
    )({ entityName }).then(({ status, data: { currentStates, errors } }) => {
      expect(status).toEqual('OK');
      expect(errors).toEqual([]);
      expect(currentStates[0].value).toEqual(1);
      expect(currentStates[0].id).toEqual(id);
    }));

  it('should queryByEntityId', async () =>
    dispatcher<Commit[], { entityName: string; id: string }>(
      (payload) => queryByEntityId(payload),
      {
        name: 'queryByEntityId',
        store,
        slice: 'query',
        SuccessAction: QUERY_SUCCESS,
        ErrorAction: QUERY_ERROR,
        logger,
      },
      (result) => (result ? Object.values<Commit>(result).reverse() : null)
    )({ entityName, id }).then(({ data, status }) => {
      expect(data).toEqual([commit]);
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
      expect(data[0]).toContain('store_query::test_001::');
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

  it('should #2 queryByEntityId: DESC order', async () =>
    dispatcher<Commit[], { entityName: string; id: string }>(
      (payload) => queryByEntityId(payload),
      {
        name: 'queryByEntityId',
        store,
        slice: 'query',
        SuccessAction: QUERY_SUCCESS,
        ErrorAction: QUERY_ERROR,
        logger,
      },
      (result) => (result ? Object.values<Commit>(result).reverse() : null)
    )({ entityName, id }).then(({ data, status }) => {
      expect(data).toEqual([newCommit, commit]);
      expect(status).toEqual('OK');
    }));

  it('should mergeCommitBatch', async () =>
    dispatcher<string[], { entityName: string; commits: Record<string, Commit> }>(
      (payload) => mergeCommitBatch(payload),
      {
        name: 'mergeBatchCommit',
        store,
        slice: 'query',
        SuccessAction: MERGE_COMMIT_BATCH_SUCCESS,
        ErrorAction: MERGE_COMMIT_BATCH_ERROR,
        logger,
      }
    )({ entityName, commits }).then(({ status, data }) => {
      expect(data).toEqual([
        'store_query::test_002::20200528133530001',
        'store_query::test_002::20200528133530002',
        'store_query::test_002::20200528133530003',
        'store_query::test_003::20200528133530004',
        'store_query::test_003::20200528133530005',
      ]);
      expect(status).toEqual('OK');
    }));

  it('should #3 queryByEntityName: return 3 counters', async () =>
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
      expect(currentStates).toEqual([
        { value: 2, id: 'test_001', ts: 1590739000 },
        { value: 3, id: 'test_002', ts: 1590740002 },
        { value: 2, id: 'test_003', ts: 1590740004 },
      ]);
    }));

  it('should #3 queryByEntityId: DESC order', async () =>
    dispatcher<Commit[], { entityName: string; id: string }>(
      (payload) => queryByEntityId(payload),
      {
        name: 'queryByEntityId',
        store,
        slice: 'query',
        SuccessAction: QUERY_SUCCESS,
        ErrorAction: QUERY_ERROR,
        logger,
      },
      (result) => (result ? Object.values<Commit>(result).reverse() : null)
    )({ entityName, id: 'test_002' }).then(({ data, status }) => {
      expect(data[0]).toEqual({
        id: 'test_002',
        entityName: 'store_query',
        version: 2,
        commitId: '20200528133530003',
        entityId: 'test_002',
        events: [
          {
            type: 'Increment',
            payload: {
              id: 'test_002',
              desc: 'store #5',
              tag: 'store,query',
              ts: 1590740002,
            },
          },
        ],
      });
      expect(status).toEqual('OK');
    }));

  it('should deleteByEntityId: return number of commits deleted', async () =>
    dispatcher<number, { entityName: string; id: string }>((payload) => deleteByEntityId(payload), {
      name: 'deleteByEntityId',
      store,
      slice: 'query',
      SuccessAction: DELETE_SUCCESS,
      ErrorAction: DELETE_ERROR,
      logger,
    })({ entityName, id: 'test_003' }).then(({ status, data }) => {
      expect(data).toEqual(2);
      expect(status).toEqual('OK');
    }));

  it('should #4 queryByEntityName: return 2 counters', async () =>
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
      expect(currentStates).toEqual([
        { value: 2, id: 'test_001', ts: 1590739000 },
        { value: 3, id: 'test_002', ts: 1590740002 },
      ]);
    }));

  it('should #4 queryByEntityId: DESC order', async () =>
    dispatcher<Commit[], { entityName: string; id: string }>(
      (payload) => queryByEntityId(payload),
      {
        name: 'queryByEntityId',
        store,
        slice: 'query',
        SuccessAction: QUERY_SUCCESS,
        ErrorAction: QUERY_ERROR,
        logger,
      },
      (result) => (result ? Object.values<Commit>(result).reverse() : null)
    )({ entityName, id: 'test_003' }).then(({ data, status }) => {
      expect(data).toBeNull();
      expect(status).toEqual('OK');
    }));

  it('should deleteByEntityName: return number of commits deleted', async () =>
    dispatcher<number, { entityName: string }>((payload) => deleteByEntityName(payload), {
      name: 'deleteByEntityName',
      store,
      slice: 'query',
      SuccessAction: DELETE_SUCCESS,
      ErrorAction: DELETE_ERROR,
      logger,
    })({ entityName }).then(({ status, data }) => {
      expect(data).toEqual(5);
      expect(status).toEqual('OK');
    }));
});
