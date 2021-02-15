require('dotenv').config({ path: './.env.test' });
import {
  Counter,
  counterIndexDefinition,
  CounterInRedis,
  counterPostSelector,
  counterPreSelector,
  counterReducer,
  isCommit,
  isOutputCounter,
  OutputCounter,
  Paginated,
  QueryHandler,
  RedisRepository,
} from '@fabric-es/fabric-cqrs';
import { enrollAdmin } from '@fabric-es/operator';
import { ApolloServer } from 'apollo-server';
import { Wallets } from 'fabric-network';
import httpStatus from 'http-status';
import type { RedisOptions } from 'ioredis';
import keys from 'lodash/keys';
import omit from 'lodash/omit';
import values from 'lodash/values';
import fetch from 'node-fetch';
import rimraf from 'rimraf';
import { createQueryHandlerService } from '..';
import { getLogger, isBaseEvent, isLoginResponse, waitForSecond } from '../../utils';
import {
  CREATE_COMMIT,
  FULL_TXT_SEARCH_COMMIT,
  FULL_TXT_SEARCH_ENTITY,
  GET_NOTIFICATION,
  GET_NOTIFICATIONS,
  ME,
} from '../query';

/**
 * ./dn-run.1-db-red-auth.sh or ./dn-run.2-db-red-auth.sh
 */
const caName = process.env.CA_NAME;
const channelName = process.env.CHANNEL_NAME;
const connectionProfile = process.env.CONNECTION_PROFILE;
const enrollmentId = process.env.ORG_ADMIN_ID;
const entityName = 'counter';
const id = `qh_gql_test_counter_001`;
const mspId = process.env.MSPID;
const proxyServerUri = process.env.PROXY_SERVER;
const orgAdminId = process.env.ORG_ADMIN_ID;
const orgAdminSecret = process.env.ORG_ADMIN_SECRET;
const timestampesOnCreate = [];
const walletPath = process.env.WALLET;
const logger = getLogger('[gateway-lib] queryHandler.unit-test.js');
const QH_PORT = 4400;
const url = `http://localhost:${QH_PORT}/graphql`;
const noAuthConfig = (body: any) => ({
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify(body),
});

/**
 * ./dn-run.1-db-red-auth.sh or ./dn-run.2-db-red-auth.sh
 */

// p.s. tag in redis cannot use '-'. Later, need to check what else character are prohibited.
const tag = 'unit_test,gw_lib,query_handler';

let server: ApolloServer;
let queryHandler: QueryHandler;
let redisRepos: Record<string, RedisRepository>;
let fetchConfig;
let commitId: string;

beforeAll(async () => {
  rimraf.sync(`${walletPath}/${orgAdminId}.id`);

  try {
    const wallet = await Wallets.newFileSystemWallet(walletPath);

    // Step 1: EnrollAdmin
    await enrollAdmin({
      enrollmentID: orgAdminId,
      enrollmentSecret: orgAdminSecret,
      connectionProfile,
      caName,
      mspId,
      wallet,
    });

    const redisOptions: RedisOptions = {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT, 10) || 6379,
      retryStrategy: (times) => Math.min(times * 50, 2000),
    };

    // Step 2. create QueryHandlerService
    const qhService = await createQueryHandlerService({
      asLocalhost: !(process.env.NODE_ENV === 'production'),
      authCheck: `${proxyServerUri}/oauth/authenticate`,
      channelName,
      connectionProfile,
      enrollmentId,
      redisOptions,
      reducers: { counter: counterReducer },
      wallet: await Wallets.newFileSystemWallet(process.env.WALLET),
    });

    // Step 3: define the Redisearch index, and selectors
    qhService.addRedisRepository<Counter, CounterInRedis, OutputCounter>({
      entityName,
      fields: counterIndexDefinition,
      postSelector: counterPostSelector,
      preSelector: counterPreSelector,
    });

    // Step 5: Prepare queryHandler
    // 1. connect Fabric
    // 2. recreate Indexes
    // 3. subscribe channel hub
    // 4. reconcile
    await qhService.prepare();

    server = qhService.server;
    queryHandler = qhService.getQueryHandler();
    redisRepos = qhService.getRedisRepos();

    // clean-up before tests
    const { data } = await queryHandler.command_getByEntityName('counter')();
    if (keys(data).length > 0) {
      for await (const { id } of values(data)) {
        await queryHandler
          .command_deleteByEntityId(entityName)({ id })
          .then(({ status }) => console.log(`status: ${status}, ${entityName}:${id} deleted`));
      }
    }

    // Step 4: clean up pre existing Redis
    await queryHandler
      .query_deleteCommitByEntityName(entityName)()
      .then(({ status }) =>
        console.log(`set-up: query_deleteByEntityName, ${entityName}, status: ${status}`)
      );

    return new Promise<void>((done) => {
      void server.listen(QH_PORT, () => {
        console.log('🚀 Query Handler Started');
        done();
      });
    });
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
});

// Tear-down the tests in queryHandler shall perform cleanup, for both command & query; so that
// unit-test can run repeatedly
afterAll(async () => {
  // for await (const [entityName, redisRepo] of Object.entries(redisRepos)) {
  //   await redisRepo
  //     .dropIndex(true)
  //     .then(() => console.log(`${entityName} - index is dropped`))
  //     .catch((error) => console.error(error));
  // }
  //
  // await queryHandler
  //   .query_deleteCommitByEntityName(entityName)()
  //   .then(({ status }) =>
  //     console.log(`tear-down: query_deleteByEntityName, ${entityName}, status: ${status}`)
  //   );

  await queryHandler
    .command_deleteByEntityId(entityName)({ id })
    .then(({ status }) =>
      console.log(`tear-down: command_deleteByEntityId, ${entityName}:${id}, ${status}`)
    );

  for await (const i of [1, 2, 3, 4, 5])
    await queryHandler
      .command_deleteByEntityId(entityName)({ id: `paginated-${i}` })
      .then(({ status }) =>
        console.log(`tear-down: command_deleteByEntityId, ${entityName}:paginated-${i}, ${status}`)
      );

  await queryHandler
    .clearNotifications({ creator: 'admin-org1.net' })
    .then(({ status }) => console.log(`clearNotification: ${status}`));

  await server.stop();

  return waitForSecond(5);
});

describe('QueryHandler Service Test', () => {
  it('should ping /isalive', async () =>
    fetch(`${proxyServerUri}/account/isalive`).then((r) => {
      if (r.status === httpStatus.NO_CONTENT) return true;
      else {
        console.error('auth server is not alive');
        process.exit(1);
      }
    }));

  it('should login OrgAdmin', async () =>
    fetch(`${proxyServerUri}/account/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: orgAdminId, password: orgAdminSecret }),
    })
      .then<unknown>((r) => r.json())
      .then((res) => {
        if (isLoginResponse(res)) {
          fetchConfig = (body: any) => ({
            method: 'POST',
            headers: {
              'content-type': 'application/json',
              authorization: `bearer ${res.access_token}`,
            },
            body: JSON.stringify(body),
          });
          return true;
        } else return Promise.reject('not login response');
      }));

  it('should me', async () =>
    fetch(url, fetchConfig({ operationName: 'Me', query: ME }))
      .then((r) => r.json())
      .then(({ data }) => expect(data?.me).toEqual('Hello')));

  it('should fail to createCommit: invalid input payload string', async () =>
    fetch(
      url,
      fetchConfig({
        operationName: 'CreateCommit',
        query: CREATE_COMMIT,
        variables: {
          entityName,
          id,
          type: 'Increment',
          payloadString: `{"id":"${id}"dfsafdqh-unit-test"}`,
        },
      })
    )
      .then((r) => r.json())
      .then(({ data, errors }) => {
        expect(data).toBeNull();
        expect(errors[0].message).toContain('SyntaxError: Unexpected token d in JSON');
      }));

  it('should createCommit', async () =>
    fetch(
      url,
      fetchConfig({
        operationName: 'CreateCommit',
        query: CREATE_COMMIT,
        variables: {
          entityName,
          id,
          type: 'Increment',
          payloadString: `{"id":"${id}","desc":"my desc","tag":"${tag}"}`,
        },
      })
    )
      .then((r) => r.json())
      .then(({ data }) => {
        const commit = data?.createCommit;
        if (isCommit(commit)) {
          commitId = commit.commitId;
          expect(commit.id).toEqual(id);
          expect(commit.entityName).toEqual(entityName);
          expect(commit.version).toEqual(0);
        } else return Promise.reject('not commit');
      }));
});

describe('Full Text Search Test', () => {
  beforeAll(async () => waitForSecond(4));

  it('should fail to fullTextSearchCommit: garbage input', async () =>
    fetch(
      url,
      fetchConfig({
        operationName: 'FullTextSearchCommit',
        query: FULL_TXT_SEARCH_COMMIT,
        variables: { query: 'xyz' },
      })
    )
      .then((r) => r.json())
      .then(({ data }) =>
        expect(data?.fullTextSearchCommit).toEqual({
          cursor: null,
          hasMore: false,
          items: [],
          total: 0,
        })
      ));

  it('should fullTextSearchCommit: search by coun*, entityName wildcard', async () =>
    fetch(
      url,
      fetchConfig({
        operationName: 'FullTextSearchCommit',
        query: FULL_TXT_SEARCH_COMMIT,
        variables: { query: 'counter*' },
      })
    )
      .then((r) => r.json())
      .then(({ data }) => {
        expect(data?.fullTextSearchCommit.total).toEqual(1);
        expect(data?.fullTextSearchCommit.hasMore).toEqual(false);
        expect(data?.fullTextSearchCommit.cursor).toEqual(1);
        const commit = data?.fullTextSearchCommit.items[0];
        if (isCommit(commit)) {
          commit.events.forEach((event) => expect(isBaseEvent(event)).toBeTruthy());
          expect(commit.id).toEqual(id);
          expect(commit.entityName).toEqual(entityName);
          expect(commit.version).toEqual(0);
        } else return Promise.reject('not commit');
      }));

  it('should fullTextSearchCommit: search by tag, @event:{increment}', async () =>
    fetch(
      url,
      fetchConfig({
        operationName: 'FullTextSearchCommit',
        query: FULL_TXT_SEARCH_COMMIT,
        variables: { query: '@event:{increment}' },
      })
    )
      .then((r) => r.json())
      .then(({ data }) => {
        expect(data?.fullTextSearchCommit.total).toEqual(1);
        expect(data?.fullTextSearchCommit.hasMore).toEqual(false);
        expect(data?.fullTextSearchCommit.cursor).toEqual(1);
        const commit = data?.fullTextSearchCommit.items[0];
        if (isCommit(commit)) {
          commit.events.forEach((event) => expect(isBaseEvent(event)).toBeTruthy());
          expect(commit.id).toEqual(id);
          expect(commit.entityName).toEqual(entityName);
          expect(commit.version).toEqual(0);
        } else return Promise.reject('not commit');
      }));

  it('should fail to fullTextSearchEntity: garbage input', async () =>
    fetch(
      url,
      fetchConfig({
        operationName: 'FullTextSearchEntity',
        query: FULL_TXT_SEARCH_ENTITY,
        variables: { entityName, query: 'xyz' },
      })
    )
      .then((r) => r.json())
      .then(({ data }) => {
        expect(data?.fullTextSearchEntity).toEqual({
          cursor: null,
          hasMore: false,
          items: [],
          total: 0,
        });
      }));

  // data.fullTextSearchEntity.items returns
  // [
  //   {
  //     createdAt: '1613367268189',
  //     creator: 'admin-org1.net',
  //     description: 'my desc',
  //     eventInvolved: [ 'Increment' ],
  //     id: 'qh_gql_test_counter_001',
  //     tags: [ 'unit_test', 'gw_lib', 'query_handler' ],
  //     timestamp: '1613367268189',
  //     value: 1
  //   }
  // ]
  it('should fullTextSearchEntity: search by entityId wildcard', async () =>
    fetch(
      url,
      fetchConfig({
        operationName: 'FullTextSearchEntity',
        query: FULL_TXT_SEARCH_ENTITY,
        variables: { entityName, query: 'qh_gql*' },
      })
    )
      .then((r) => r.json())
      .then(({ data }: { data: { fullTextSearchEntity: Paginated<any> } }) => {
        expect(data?.fullTextSearchEntity.total).toEqual(1);
        expect(data?.fullTextSearchEntity.hasMore).toEqual(false);
        expect(data?.fullTextSearchEntity.cursor).toEqual(1);
        data?.fullTextSearchEntity.items.forEach((item) =>
          expect(isOutputCounter(item)).toBeTruthy()
        );
      }));

  it('should fullTextSearchEntity: search by tag, @tag:{query*}', async () =>
    fetch(
      url,
      fetchConfig({
        operationName: 'FullTextSearchEntity',
        query: FULL_TXT_SEARCH_ENTITY,
        variables: { entityName, query: '@tag:{query*}' },
      })
    )
      .then((r) => r.json())
      .then(({ data }) => {
        expect(data?.fullTextSearchEntity.total).toEqual(1);
        expect(data?.fullTextSearchEntity.hasMore).toEqual(false);
        expect(data?.fullTextSearchEntity.cursor).toEqual(1);
        data?.fullTextSearchEntity.items.forEach((item) =>
          expect(isOutputCounter(item)).toBeTruthy()
        );
      }));
});

describe('Paginated search', () => {
  beforeAll(async () => {
    for await (const i of [1, 2, 3, 4, 5]) {
      timestampesOnCreate.push(Math.floor(Date.now() / 1000));

      await fetch(
        url,
        fetchConfig({
          operationName: 'CreateCommit',
          query: CREATE_COMMIT,
          variables: {
            entityName,
            id: `paginated-${i}`,
            type: i % 2 === 0 ? 'Decrement' : 'Increment',
            payloadString: `{"id":"paginated-${i}","desc":"my desc paginated-${i}","tag":"paginated_${i}"}`,
          },
        })
      )
        .then((r) => r.text())
        .then((data) => console.log(data));

      await new Promise<void>((done) => setTimeout(() => done(), 2000));
    }
  });

  // when searching out-of-range, the other search criteria remains valid.
  // therefore, it is not returning null, and total is also valid
  it('should paginated Entity, cursor=10, out-of-range', async () =>
    fetch(
      url,
      fetchConfig({
        operationName: 'FullTextSearchEntity',
        query: FULL_TXT_SEARCH_ENTITY,
        variables: {
          cursor: 10,
          pagesize: 2,
          entityName,
          query: '@id:paginated*',
        },
      })
    )
      .then((r) => r.json())
      .then(({ data, errors }) => {
        expect(data?.fullTextSearchEntity).toEqual({
          total: 5,
          hasMore: false,
          cursor: null,
          items: [],
        });
        expect(errors).toBeUndefined();
      }));

  it('should fail to paginated Entity: missing entityName', async () =>
    fetch(
      url,
      fetchConfig({
        operationName: 'FullTextSearchEntity',
        query: FULL_TXT_SEARCH_ENTITY,
        variables: {
          cursor: 0,
          pagesize: 2,
          query: '@id:paginated*',
        },
      })
    )
      .then((r) => r.json())
      .then(({ data, errors }) => {
        expect(data).toBeUndefined();
        expect(errors[0].message).toContain('"$entityName" of required type "String!"');
      }));

  it('should fail to paginated Entity: invalid input EntityName', async () =>
    fetch(
      url,
      fetchConfig({
        operationName: 'FullTextSearchEntity',
        query: FULL_TXT_SEARCH_ENTITY,
        variables: {
          cursor: 0,
          pagesize: 2,
          entityName: 'noop',
          query: '@id:paginated*',
        },
      })
    )
      .then((r) => r.json())
      .then(({ data, errors }) => {
        expect(data).toBeNull();
        expect(errors[0].message).toContain('entity repo not found');
      }));

  it('should paginated Entity, cursor=0', async () =>
    fetch(
      url,
      fetchConfig({
        operationName: 'FullTextSearchEntity',
        query: FULL_TXT_SEARCH_ENTITY,
        variables: {
          cursor: 0,
          pagesize: 2,
          entityName,
          query: '@id:paginated*',
        },
      })
    )
      .then((r) => r.json())
      .then(({ data, errors }) => {
        console.log(data);
        expect(data?.fullTextSearchEntity.hasMore).toEqual(true);
        expect(data?.fullTextSearchEntity.cursor).toEqual(2);
        expect(data?.fullTextSearchEntity.items.map(({ id }) => id)).toEqual([
          'paginated-1',
          'paginated-2',
        ]);
        expect(errors).toBeUndefined();
      }));

  /* ============
  it('should paginatedEntity, last 3rd item: cursor=3 (total is 6)', async () =>
    fetch(
      url,
      fetchConfig({
        operationName: 'PaginatedEntity',
        query: PAGINATED_ENTITY,
        variables: {
          cursor: 3,
          pagesize: 2,
          entityName,
          sortByField: 'id',
          sort: 'ASC',
        },
      })
    )
      .then((r) => r.json())
      .then(({ data, errors }) => {
        expect(data?.paginatedEntity.hasMore).toEqual(true);
        expect(data?.paginatedEntity.cursor).toEqual(5);
        expect(data?.paginatedEntity.items.map(({ id }) => id)).toEqual([
          'paginated-4',
          'paginated-5',
        ]);
        expect(errors).toBeUndefined();
      }));

  it('should paginatedEntity, last 2nd item: cursor=4 (total is 6)', async () =>
    fetch(
      url,
      fetchConfig({
        operationName: 'PaginatedEntity',
        query: PAGINATED_ENTITY,
        variables: {
          cursor: 4,
          pagesize: 2,
          entityName,
          sortByField: 'id',
          sort: 'ASC',
        },
      })
    )
      .then((r) => r.json())
      .then(({ data, errors }) => {
        expect(data?.paginatedEntity.hasMore).toEqual(false);
        expect(data?.paginatedEntity.cursor).toEqual(6);
        expect(data?.paginatedEntity.items.map(({ id }) => id)).toEqual([
          'paginated-5',
          'qh_gql_test_counter_001',
        ]);
        expect(errors).toBeUndefined();
      }));

  it('should paginatedEntity, last item: cursor=5 (total is 6)', async () =>
    fetch(
      url,
      fetchConfig({
        operationName: 'PaginatedEntity',
        query: PAGINATED_ENTITY,
        variables: {
          cursor: 5,
          pagesize: 2,
          entityName,
          sortByField: 'id',
          sort: 'ASC',
        },
      })
    )
      .then((r) => r.json())
      .then(({ data, errors }) => {
        expect(data?.paginatedEntity.hasMore).toEqual(false);
        expect(data?.paginatedEntity.cursor).toEqual(6);
        expect(data?.paginatedEntity.items.map(({ id }) => id)).toEqual([
          'qh_gql_test_counter_001',
        ]);
        expect(errors).toBeUndefined();
      }));

  it('should paginatedEntity, creator=non_exist', async () =>
    fetch(
      url,
      fetchConfig({
        operationName: 'PaginatedEntity',
        query: PAGINATED_ENTITY,
        variables: {
          creator: 'non-exist enrollmentId',
          cursor: 2,
          pagesize: 2,
          entityName,
          sortByField: 'id',
          sort: 'ASC',
        },
      })
    )
      .then((r) => r.json())
      .then(({ data, errors }) => {
        expect(data?.paginatedEntity).toEqual({
          cursor: null,
          hasMore: false,
          items: [],
          total: 0,
        });
        expect(errors).toBeUndefined();
      }));

  it('should paginatedEntity, by time range of CREATED', async () =>
    fetch(
      url,
      fetchConfig({
        operationName: 'PaginatedEntity',
        query: PAGINATED_ENTITY,
        variables: {
          cursor: 0,
          pagesize: 10,
          entityName,
          sortByField: 'id',
          sort: 'ASC',
          scope: 'CREATED',
          startTime: timestampesOnCreate[1],
          endTime: timestampesOnCreate[3] + 1,
        },
      })
    )
      .then((r) => r.json())
      .then(({ data, errors }) => {
        expect(data?.paginatedEntity.hasMore).toEqual(false);
        expect(data?.paginatedEntity.cursor).toEqual(3);
        expect(data?.paginatedEntity.items.map(({ id }) => id)).toEqual([
          'paginated-2',
          'paginated-3',
          'paginated-4',
        ]);
        expect(errors).toBeUndefined();
      }));

  it('should paginatedEntity, for CREATED > specifc time', async () =>
    fetch(
      url,
      fetchConfig({
        operationName: 'PaginatedEntity',
        query: PAGINATED_ENTITY,
        variables: {
          cursor: 0,
          pagesize: 10,
          entityName,
          sortByField: 'id',
          sort: 'ASC',
          scope: 'CREATED',
          startTime: timestampesOnCreate[1],
          endTime: null,
        },
      })
    )
      .then((r) => r.json())
      .then(({ data, errors }) => {
        expect(data?.paginatedEntity.hasMore).toEqual(false);
        expect(data?.paginatedEntity.cursor).toEqual(4);
        expect(data?.paginatedEntity.items.map(({ id }) => id)).toEqual([
          'paginated-2',
          'paginated-3',
          'paginated-4',
          'paginated-5',
        ]);
        expect(errors).toBeUndefined();
      }));

  it('should paginatedEntity, for CREATED < specifc time', async () =>
    fetch(
      url,
      fetchConfig({
        operationName: 'PaginatedEntity',
        query: PAGINATED_ENTITY,
        variables: {
          cursor: 0,
          pagesize: 10,
          entityName,
          sortByField: 'id',
          sort: 'ASC',
          scope: 'CREATED',
          startTime: 0,
          endTime: timestampesOnCreate[1] + 1,
        },
      })
    )
      .then((r) => r.json())
      .then(({ data, errors }) => {
        expect(data?.paginatedEntity.hasMore).toEqual(false);
        expect(data?.paginatedEntity.cursor).toEqual(3);
        expect(data?.paginatedEntity.items.map(({ id }) => id)).toEqual([
          'paginated-1',
          'paginated-2',
          'qh_gql_test_counter_001',
        ]);
        expect(errors).toBeUndefined();
      }));

  // when searching out-of-range, the other search criteria remains valid.
  // therefore, it is not returning null, and total is also valid
  it('should paginatedCommit, cursor=10, out-of-range', async () =>
    fetch(
      url,
      fetchConfig({
        operationName: 'PaginatedCommit',
        query: PAGINATED_COMMIT,
        variables: {
          cursor: 10,
          pagesize: 2,
          entityName,
          sortByField: 'id',
          sort: 'ASC',
        },
      })
    )
      .then((r) => r.json())
      .then(({ data, errors }) => {
        expect(data?.paginatedCommit).toEqual({
          total: 6,
          hasMore: false,
          cursor: null,
          items: [],
        });
        expect(errors).toBeUndefined();
      }));

  it('should fail to paginatedCommit: invalid input argument', async () =>
    fetch(
      url,
      fetchConfig({
        operationName: 'PaginatedCommit',
        query: PAGINATED_COMMIT,
        variables: {
          cursor: 0,
          pagesize: 2,
          entityName,
          sortByField: 'non-exist field',
          sort: 'ASC',
        },
      })
    )
      .then((r) => r.json())
      .then(({ data, errors }) => {
        expect(data).toBeNull();
        expect(errors[0].message).toContain('non-exist');
      }));

  it('should fail to paginatedCommit: invalid input argument', async () =>
    fetch(
      url,
      fetchConfig({
        operationName: 'PaginatedCommit',
        query: PAGINATED_COMMIT,
        variables: {
          cursor: 0,
          pagesize: 2,
          entityName: 'noop',
          sortByField: 'id',
          sort: 'ASC',
        },
      })
    )
      .then((r) => r.json())
      .then(({ data, errors }) => {
        expect(data?.paginatedCommit).toEqual({
          cursor: null,
          hasMore: false,
          items: [],
          total: 0,
        });
        expect(errors).toBeUndefined();
      }));

  it('should paginatedCommit, cursor=0', async () =>
    fetch(
      url,
      fetchConfig({
        operationName: 'PaginatedCommit',
        query: PAGINATED_COMMIT,
        variables: {
          cursor: 0,
          pagesize: 2,
          entityName,
          sortByField: 'id',
          sort: 'ASC',
        },
      })
    )
      .then((r) => r.json())
      .then(({ data, errors }) => {
        expect(data?.paginatedCommit.hasMore).toEqual(true);
        expect(data?.paginatedCommit.cursor).toEqual(2);
        expect(data?.paginatedCommit.items.map(({ id }) => id)).toEqual([
          'paginated-1',
          'paginated-2',
        ]);
        expect(errors).toBeUndefined();
      }));

  it('should paginatedCommit, last 3rd item: cursor=3 (total is 6)', async () =>
    fetch(
      url,
      fetchConfig({
        operationName: 'PaginatedCommit',
        query: PAGINATED_COMMIT,
        variables: {
          cursor: 3,
          pagesize: 2,
          entityName,
          sortByField: 'id',
          sort: 'ASC',
        },
      })
    )
      .then((r) => r.json())
      .then(({ data, errors }) => {
        expect(data?.paginatedCommit.hasMore).toEqual(true);
        expect(data?.paginatedCommit.cursor).toEqual(5);
        expect(data?.paginatedCommit.items.map(({ id }) => id)).toEqual([
          'paginated-4',
          'paginated-5',
        ]);
        expect(errors).toBeUndefined();
      }));

  it('should paginatedCommit, last 2nd item: cursor=4 (total is 6)', async () =>
    fetch(
      url,
      fetchConfig({
        operationName: 'PaginatedCommit',
        query: PAGINATED_COMMIT,
        variables: {
          cursor: 4,
          pagesize: 2,
          entityName,
          sortByField: 'id',
          sort: 'ASC',
        },
      })
    )
      .then((r) => r.json())
      .then(({ data, errors }) => {
        expect(data?.paginatedCommit.hasMore).toEqual(false);
        expect(data?.paginatedCommit.cursor).toEqual(6);
        expect(data?.paginatedCommit.items.map(({ id }) => id)).toEqual([
          'paginated-5',
          'qh_gql_test_counter_001',
        ]);
        expect(errors).toBeUndefined();
      }));

  it('should paginatedCommit, last item: cursor=5 (total is 6)', async () =>
    fetch(
      url,
      fetchConfig({
        operationName: 'PaginatedCommit',
        query: PAGINATED_COMMIT,
        variables: {
          cursor: 5,
          pagesize: 2,
          entityName,
          sortByField: 'id',
          sort: 'ASC',
        },
      })
    )
      .then((r) => r.json())
      .then(({ data, errors }) => {
        expect(data?.paginatedCommit.hasMore).toEqual(false);
        expect(data?.paginatedCommit.cursor).toEqual(6);
        expect(data?.paginatedCommit.items.map(({ id }) => id)).toEqual([
          'qh_gql_test_counter_001',
        ]);
        expect(errors).toBeUndefined();
      }));

  it('should paginatedCommit, creator=non_exist', async () =>
    fetch(
      url,
      fetchConfig({
        operationName: 'PaginatedCommit',
        query: PAGINATED_COMMIT,
        variables: {
          creator: 'non-exist enrollmentId',
          cursor: 2,
          pagesize: 2,
          entityName,
          sortByField: 'id',
          sort: 'ASC',
        },
      })
    )
      .then((r) => r.json())
      .then(({ data, errors }) => {
        expect(data?.paginatedCommit).toEqual({
          cursor: null,
          hasMore: false,
          items: [],
          total: 0,
        });
        expect(errors).toBeUndefined();
      }));

  it('should paginatedCommit, by single event', async () =>
    fetch(
      url,
      fetchConfig({
        operationName: 'PaginatedCommit',
        query: PAGINATED_COMMIT,
        variables: {
          events: ['increment'],
          cursor: 0,
          pagesize: 2,
          entityName,
          sortByField: 'id',
          sort: 'ASC',
        },
      })
    )
      .then((r) => r.json())
      .then(({ data, errors }) => {
        expect(data?.paginatedCommit.hasMore).toEqual(true);
        expect(data?.paginatedCommit.cursor).toEqual(2);
        expect(data?.paginatedCommit.items.map(({ id }) => id)).toEqual([
          'paginated-1',
          'paginated-3',
        ]);
        expect(errors).toBeUndefined();
      }));

  it('should paginatedCommit, by events array', async () =>
    fetch(
      url,
      fetchConfig({
        operationName: 'PaginatedCommit',
        query: PAGINATED_COMMIT,
        variables: {
          events: ['increment', 'decrement'],
          cursor: 0,
          pagesize: 2,
          entityName,
          sortByField: 'id',
          sort: 'ASC',
        },
      })
    )
      .then((r) => r.json())
      .then(({ data, errors }) => {
        expect(data?.paginatedCommit.hasMore).toEqual(true);
        expect(data?.paginatedCommit.cursor).toEqual(2);
        expect(data?.paginatedCommit.items.map(({ id }) => id)).toEqual([
          'paginated-1',
          'paginated-2',
        ]);
        expect(errors).toBeUndefined();
      }));

  it('should paginatedCommit, by time range (ts)', async () =>
    fetch(
      url,
      fetchConfig({
        operationName: 'PaginatedCommit',
        query: PAGINATED_COMMIT,
        variables: {
          cursor: 0,
          pagesize: 10,
          entityName,
          sortByField: 'id',
          sort: 'ASC',
          startTime: timestampesOnCreate[1],
          endTime: timestampesOnCreate[3] + 2,
        },
      })
    )
      .then((r) => r.json())
      .then(({ data, errors }) => {
        expect(data?.paginatedCommit.hasMore).toEqual(false);
        expect(data?.paginatedCommit.cursor).toEqual(3);
        expect(data?.paginatedCommit.items.map(({ id }) => id)).toEqual([
          'paginated-2',
          'paginated-3',
          'paginated-4',
        ]);
        expect(errors).toBeUndefined();
      }));

  it('should paginatedCommit, ts > specific time', async () =>
    fetch(
      url,
      fetchConfig({
        operationName: 'PaginatedCommit',
        query: PAGINATED_COMMIT,
        variables: {
          cursor: 0,
          pagesize: 10,
          entityName,
          sortByField: 'id',
          sort: 'ASC',
          startTime: timestampesOnCreate[1],
          endTime: 0,
        },
      })
    )
      .then((r) => r.json())
      .then(({ data, errors }) => {
        expect(data?.paginatedCommit.hasMore).toEqual(false);
        expect(data?.paginatedCommit.cursor).toEqual(4);
        expect(data?.paginatedCommit.items.map(({ id }) => id)).toEqual([
          'paginated-2',
          'paginated-3',
          'paginated-4',
          'paginated-5',
        ]);
        expect(errors).toBeUndefined();
      }));

  it('should paginatedCommit, ts < specific time', async () =>
    fetch(
      url,
      fetchConfig({
        operationName: 'PaginatedCommit',
        query: PAGINATED_COMMIT,
        variables: {
          cursor: 0,
          pagesize: 10,
          entityName,
          sortByField: 'id',
          sort: 'ASC',
          startTime: 0,
          endTime: timestampesOnCreate[1] + 1,
        },
      })
    )
      .then((r) => r.json())
      .then(({ data, errors }) => {
        expect(data?.paginatedCommit.hasMore).toEqual(false);
        expect(data?.paginatedCommit.cursor).toEqual(3);
        expect(data?.paginatedCommit.items.map(({ id }) => id)).toEqual([
          'paginated-1',
          'paginated-2',
          'qh_gql_test_counter_001',
        ]);
        expect(errors).toBeUndefined();
      }));

  it('should getEntityInfo', async () =>
    fetch(url, fetchConfig({ operationName: 'GetEntityInfo', query: GET_ENTITYINFO }))
      .then((r) => r.json())
      .then(({ data, errors }) => {
        expect(data.getEntityInfo).toEqual([
          {
            entityName: 'counter',
            events: ['Increment', 'Decrement'],
            creators: ['admin-org1.net'],
            orgs: ['Org1MSP'],
            total: 6,
            totalCommit: 6,
            tagged: [
              'unit_test',
              'gw_lib',
              'query_handler',
              'paginated_5',
              'paginated_4',
              'paginated_3',
              'paginated_2',
              'paginated_1',
            ],
          },
          {
            entityName: 'organization',
            events: [],
            creators: [],
            orgs: [],
            total: 0,
            totalCommit: 0,
            tagged: [],
          },
        ]);
        expect(errors).toBeUndefined();
      }));

  it('should getNotifications', async () =>
    fetch(url, fetchConfig({ operationName: 'GetNotifications', query: GET_NOTIFICATIONS }))
      .then((r) => r.json())
      .then(({ data, errors }) => {
        data.getNotifications
          .map(({ creator, entityName, read }) => ({ creator, entityName, read }))
          .forEach((item) =>
            expect(item).toEqual({ creator: orgAdminId, entityName, read: false })
          );
        expect(errors).toBeUndefined();
      }));

  it('should get one notification', async () =>
    fetch(
      url,
      fetchConfig({
        operationName: 'GetNotification',
        query: GET_NOTIFICATION,
        variables: { entityName, id, commitId },
      })
    )
      .then((r) => r.json())
      .then(({ data, errors }) => {
        // after reading it, the "read" flag change from false to true
        expect(data.getNotification.read).toBeTruthy();
        expect(errors).toBeUndefined();
      }));

   */
});

/*
describe('Authentication Failure tests', () => {
  it('should fail with createCommit: no token', async () =>
    fetch(
      url,
      noAuthConfig({
        operationName: 'CreateCommit',
        query: CREATE_COMMIT,
        variables: {
          entityName,
          id,
          type: 'Increment',
          payloadString: `{"id":"${id}","desc":"my desc","tag":"${tag}"}`,
        },
      })
    )
      .then((r) => r.json())
      .then(({ data, errors }) => {
        expect(data).toBeNull();
        expect(errors[0].message).toEqual('could not find user');
      }));

  it('should fail with fullTextSearchCommit: no token', async () =>
    fetch(
      url,
      noAuthConfig({
        operationName: 'FullTextSearchCommit',
        query: FULL_TXT_SEARCH_COMMIT,
        variables: { query: 'counter*' },
      })
    )
      .then((r) => r.json())
      .then(({ data, errors }) => {
        expect(data).toBeNull();
        expect(errors[0].message).toEqual('could not find user');
      }));

  it('should fail with fullTextSearchEntity: no token', async () =>
    fetch(
      url,
      noAuthConfig({
        operationName: 'FullTextSearchEntity',
        query: FULL_TXT_SEARCH_ENTITY,
        variables: { query: 'qh_gql*' },
      })
    )
      .then((r) => r.json())
      .then(({ data, errors }) => {
        expect(data).toBeNull();
        expect(errors[0].message).toEqual('could not find user');
      }));

  it('should fail with paginatedEntity: no token', async () =>
    fetch(
      url,
      noAuthConfig({
        operationName: 'PaginatedEntity',
        query: PAGINATED_ENTITY,
        variables: {
          cursor: 0,
          pagesize: 2,
          entityName,
          sortByField: 'id',
          sort: 'ASC',
        },
      })
    )
      .then((r) => r.json())
      .then(({ data, errors }) => {
        expect(data).toBeNull();
        expect(errors[0].message).toEqual('could not find user');
      }));

  it('should fail with paginatedCommit: no token', async () =>
    fetch(
      url,
      noAuthConfig({
        operationName: 'PaginatedCommit',
        query: PAGINATED_COMMIT,
        variables: {
          cursor: 0,
          pagesize: 2,
          entityName,
          sortByField: 'id',
          sort: 'ASC',
        },
      })
    )
      .then((r) => r.json())
      .then(({ data, errors }) => {
        expect(data).toBeNull();
        expect(errors[0].message).toEqual('could not find user');
      }));
});


 */
