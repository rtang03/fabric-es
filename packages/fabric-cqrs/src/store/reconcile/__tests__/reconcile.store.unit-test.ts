require('dotenv').config({ path: './.env.test' });
import Redis from 'ioredis';
import { Store } from 'redux';
import { createQueryDatabase, dummyReducer } from '../../../queryHandler';
import type { QueryDatabaseResponse } from '../../../types';
import { dispatcher, getLogger } from '../../../utils';
import { action as queryAction } from '../../query';
import { action } from '../action';
import { getStore, entityName } from './__utils__';

let store: Store;
let redis: Redis.Redis;

const logger = getLogger({ name: 'reconile.store.unit-test.ts' });
const reducers = { [entityName]: dummyReducer };
const { reconcile, RECONCILE_SUCCESS, RECONCILE_ERROR } = action;

beforeAll(async () => {
  redis = new Redis();
  const queryDatabase = createQueryDatabase(redis);
  store = getStore({ queryDatabase, reducers, logger });

  await dispatcher<QueryDatabaseResponse, { entityName: string }>(
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

  await redis
    .send_command('FT.DROP', ['cidx'])
    .then((result) => console.log(`cidx is dropped: ${result}`))
    .catch((result) => console.log(`cidx is not dropped: ${result}`));

  await redis
    .send_command('FT.DROP', ['eidx'])
    .then((result) => console.log(`eidx is dropped: ${result}`))
    .catch((result) => console.log(`eidx is not dropped: ${result}`));
});

afterAll(
  async () => new Promise<void>((ok) => setTimeout(() => ok(), 2000))
);

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
