require('dotenv').config({ path: './.env.test' });
import { Redisearch } from 'redis-modules-sdk';
import { Store } from 'redux';
import { createQueryDatabaseV2, createRedisRepository } from '../../../queryHandlerV2';
import type { OutputCommit, QueryDatabaseV2, RedisRepository } from '../../../queryHandlerV2/types';
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
import { dispatcher, getLogger, isCommitRecord, waitForSecond } from '../../../utils';
import { action as queryAction } from '../../query';
import { action as projAction, action } from '../action';
import { getStore, commit, commits, newCommit, entityName } from './__utils__';

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

    // Step 7: remove existing all notifications
    await queryDatabase
      .clearNotifications({ creator: 'org1-admin', entityName })
      .then(({ status }) => console.log(`clearNotifications: ${status}`));
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

  // await queryDatabase
  //   .deleteEntityByEntityName({ entityName })
  //   .then(({ message }) => console.log(message))
  //   .catch((result) => console.log(result));

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

describe('Store/query Test', () => {
  beforeAll(async () => {
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
      expect(data).toEqual(['c:store_projection:test_001:20200528133519841']);
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
        { key: 'e:store_projection:test_001', status: 'OK' },
        { key: 'c:store_projection:test_001:20200528133520842', status: 'OK' },
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
        { key: 'e:store_projection:test_002', status: 'OK' },
        { key: 'e:store_projection:test_003', status: 'OK' },
      ]);
    }));

  it('should query:deleteEntityByEntityName', async () =>
    dispatcher<number, { entityName: string }>(
      (payload) => queryAction.deleteEntityByEntityName(payload),
      {
        store,
        logger,
        slice: 'query',
        name: 'query:deleteEntityByEntityName',
        SuccessAction: queryAction.DELETE_ENTITY_SUCCESS,
        ErrorAction: queryAction.DELETE_ENTITY_ERROR,
      }
    )({ entityName }).then(({ data, status }) => {
      expect(status).toEqual('OK');
      expect(data).toBe(3);
    }));

  it('should getNotifications', async () =>
    dispatcher<Record<string, string>, { creator: string; entityName: string; id: string }>(
      (payload) => queryAction.getNotifications(payload),
      {
        name: 'query:getNotifications',
        store,
        slice: 'query',
        logger,
        SuccessAction: queryAction.GET_NOTI_SUCCESS,
        ErrorAction: queryAction.GET_NOTI_ERROR,
      }
    )({ creator: 'org1-admin', entityName, id }).then(({ data, status }) => {
      expect(status).toEqual('OK');
      expect(data).toEqual({ 'n:org1-admin:store_projection:test_001:20200528133520842': '1' });
    }));

  it('should getNotification: first read = 1', async () =>
    dispatcher<
      Record<string, string>,
      { creator: string; entityName: string; id: string; commitId: string }
    >((payload) => queryAction.getNotification(payload), {
      name: 'query:getNotification',
      store,
      slice: 'query',
      logger,
      SuccessAction: queryAction.GET_NOTI_SUCCESS,
      ErrorAction: queryAction.GET_NOTI_ERROR,
    })({ creator: 'org1-admin', entityName, id, commitId: '20200528133520842' }).then(
      ({ data, status }) => {
        expect(status).toEqual('OK');
        expect(data).toEqual({ 'n:org1-admin:store_projection:test_001:20200528133520842': '1' });
      }
    ));

  it('should getNotification: second read = 0', async () =>
    dispatcher<
      Record<string, string>,
      { creator: string; entityName: string; id: string; commitId: string }
    >((payload) => queryAction.getNotification(payload), {
      name: 'query:getNotification',
      store,
      slice: 'query',
      logger,
      SuccessAction: queryAction.GET_NOTI_SUCCESS,
      ErrorAction: queryAction.GET_NOTI_ERROR,
    })({ creator: 'org1-admin', entityName, id, commitId: '20200528133520842' }).then(
      ({ data, status }) => {
        expect(status).toEqual('OK');
        expect(data).toEqual({ 'n:org1-admin:store_projection:test_001:20200528133520842': '0' });
      }
    ));

  it('should clearNotification', async () =>
    dispatcher<string[], { creator: string; entityName: string; id: string; commitId: string }>(
      (payload) => queryAction.clearNotification(payload),
      {
        name: 'query:clearNotification',
        store,
        slice: 'query',
        logger,
        SuccessAction: queryAction.CLEAR_NOTI_SUCCESS,
        ErrorAction: queryAction.CLEAR_NOTI_ERROR,
      }
    )({ creator: 'org1-admin', entityName, id, commitId: '20200528133520842' }).then(
      ({ data, status }) => {
        expect(status).toEqual('OK');
        expect(data).toEqual(['n:org1-admin:store_projection:test_001:20200528133520842']);
      }
    ));
});
