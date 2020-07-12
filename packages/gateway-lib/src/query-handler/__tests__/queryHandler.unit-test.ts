require('dotenv').config({ path: './.env.test' });
import { counterReducer, isCommit, QueryHandler, QueryHandlerEntity } from '@fabric-es/fabric-cqrs';
import { enrollAdmin } from '@fabric-es/operator';
import { ApolloServer } from 'apollo-server';
import { Wallets } from 'fabric-network';
import httpStatus from 'http-status';
import type { Redis, RedisOptions } from 'ioredis';
import keys from 'lodash/keys';
import omit from 'lodash/omit';
import values from 'lodash/values';
import fetch from 'node-fetch';
import rimraf from 'rimraf';
import { createQueryHandlerService, rebuildIndex } from '..';
import { getLogger, isLoginResponse } from '../../utils';
import {
  CREATE_COMMIT,
  FULL_TXT_SEARCH_COMMIT,
  FULL_TXT_SEARCH_ENTITY,
  GET_ENTITYINFO,
  GET_NOTIFICATION,
  GET_NOTIFICATIONS,
  ME,
  PAGINATED_COMMIT,
  PAGINATED_ENTITY,
} from '../query';

/**
 * ./dn-run.1-db-red-auth.sh or ./dn-run.2-db-red-auth.sh
 */
const proxyServerUri = process.env.PROXY_SERVER;
const caUrl = process.env.ORG_CA_URL;
const channelName = process.env.CHANNEL_NAME;
const connectionProfile = process.env.CONNECTION_PROFILE;
const fabricNetwork = process.env.NETWORK_LOCATION;
const mspId = process.env.MSPID;
const orgAdminId = process.env.ORG_ADMIN_ID;
const orgAdminSecret = process.env.ORG_ADMIN_SECRET;
const walletPath = process.env.WALLET;
const entityName = 'counter';
const enrollmentId = process.env.ORG_ADMIN_ID;
const id = `qh_gql_test_counter_001`;
const logger = getLogger('[gateway-lib] queryHandler.unit-test.js');
const QH_PORT = 4400;
const timestampesOnCreate = [];
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
let publisher: Redis;
let fetchConfig;
let commitId: string;

beforeAll(async () => {
  rimraf.sync(`${walletPath}/${orgAdminId}.id`);

  try {
    const wallet = await Wallets.newFileSystemWallet(walletPath);

    await enrollAdmin({
      enrollmentID: orgAdminId,
      enrollmentSecret: orgAdminSecret,
      caUrl,
      connectionProfile,
      fabricNetwork,
      mspId,
      wallet,
    });

    const redisOptions: RedisOptions = {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT, 10) || 6379,
      retryStrategy: (times) => Math.min(times * 50, 2000),
    };

    const qhService = await createQueryHandlerService([entityName], {
      redisOptions,
      asLocalhost: !(process.env.NODE_ENV === 'production'),
      channelName,
      connectionProfile,
      enrollmentId,
      reducers: { counter: counterReducer },
      wallet: await Wallets.newFileSystemWallet(process.env.WALLET),
      authCheck: `${proxyServerUri}/oauth/authenticate`,
    });

    server = qhService.server;
    queryHandler = qhService.queryHandler;
    publisher = qhService.publisher;

    // setup
    await rebuildIndex(publisher, logger);

    const { data } = await queryHandler.command_getByEntityName('counter')();

    if (keys(data).length > 0) {
      for await (const { id } of values(data)) {
        await queryHandler
          .command_deleteByEntityId(entityName)({ id })
          .then(({ status }) =>
            console.log(
              `setup: command_deleteByEntityId, status: ${status}, ${entityName}:${id} deleted`
            )
          );
      }
    }

    await queryHandler
      .query_deleteCommitByEntityName(entityName)()
      .then(({ status }) =>
        console.log(`set-up: query_deleteByEntityName, ${entityName}, status: ${status}`)
      );

    // remove all pre-existing notification
    await queryHandler
      .queryNotify({ creator: orgAdminId, expireNow: true })
      .then(({ status }) => console.log(`remove pre-existing notification: ${status}`));

    return new Promise((done) =>
      server.listen(QH_PORT, () => {
        console.log('🚀 Query Handler Started');
        done();
      })
    );
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
});

// Tear-down the tests in queryHandler shall perform cleanup, for both command & query; so that
// unit-test can run repeatedly
afterAll(async () => {
  await publisher
    .send_command('FT.DROP', ['cidx'])
    .then((result) => console.log(`cidx is dropped: ${result}`))
    .catch((result) => console.log(`cidx is not dropped: ${result}`));

  await publisher
    .send_command('FT.DROP', ['eidx'])
    .then((result) => console.log(`eidx is dropped: ${result}`))
    .catch((result) => console.log(`eidx is not dropped: ${result}`));

  await queryHandler
    .query_deleteCommitByEntityName(entityName)()
    .then(({ status }) =>
      console.log(`tear-down: query_deleteByEntityName, ${entityName}, status: ${status}`)
    );

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
    .queryNotify({ creator: orgAdminId, expireNow: true })
    .then(({ status }) => console.log(`remove notification: ${status}`));

  await server.stop();

  return new Promise((done) => setTimeout(() => done(), 2000));
});

describe('QuerHandler Service Test', () => {
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
  beforeAll(() => new Promise((done) => setTimeout(() => done(), 4000)));

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
        variables: { query: 'xyz' },
      })
    )
      .then((r) => r.json())
      .then(({ data }) =>
        expect(data?.fullTextSearchEntity).toEqual({
          cursor: null,
          hasMore: false,
          items: [],
          total: 0,
        })
      ));

  it('should fullTextSearchEntity: search by entityId wildcard', async () =>
    fetch(
      url,
      fetchConfig({
        operationName: 'FullTextSearchEntity',
        query: FULL_TXT_SEARCH_ENTITY,
        variables: { query: 'qh_gql*' },
      })
    )
      .then((r) => r.json())
      .then(({ data }) => {
        expect(data?.fullTextSearchEntity.total).toEqual(1);
        expect(data?.fullTextSearchEntity.hasMore).toEqual(false);
        expect(data?.fullTextSearchEntity.cursor).toEqual(1);
        const counterObject: QueryHandlerEntity = data?.fullTextSearchEntity.items[0];
        expect(
          omit(counterObject, 'value', 'commits', 'created', 'lastModified', 'timeline', 'reducer')
        ).toEqual({
          id,
          entityName,
          desc: 'my desc',
          events: 'Increment',
          creator: 'admin-org1.net',
          tag: 'unit_test,gw_lib,query_handler',
        });
      }));

  it('should fullTextSearchEntity: search by tag, @tag:{query*}', async () =>
    fetch(
      url,
      fetchConfig({
        operationName: 'FullTextSearchEntity',
        query: FULL_TXT_SEARCH_ENTITY,
        variables: { query: '@tag:{query*}' },
      })
    )
      .then((r) => r.json())
      .then(({ data }) => {
        expect(data?.fullTextSearchEntity.total).toEqual(1);
        expect(data?.fullTextSearchEntity.hasMore).toEqual(false);
        expect(data?.fullTextSearchEntity.cursor).toEqual(1);
        const counterObject: QueryHandlerEntity = data?.fullTextSearchEntity.items[0];
        expect(
          omit(counterObject, 'value', 'commits', 'created', 'lastModified', 'timeline', 'reducer')
        ).toEqual({
          id,
          entityName,
          desc: 'my desc',
          events: 'Increment',
          creator: 'admin-org1.net',
          tag: 'unit_test,gw_lib,query_handler',
        });
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

      await new Promise((done) => setTimeout(() => done(), 2000));
    }
  });

  // when searching out-of-range, the other search criteria remains valid.
  // therefore, it is not returning null, and total is also valid
  it('should paginatedEntity, cursor=10, out-of-range', async () =>
    fetch(
      url,
      fetchConfig({
        operationName: 'PaginatedEntity',
        query: PAGINATED_ENTITY,
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
        expect(data?.paginatedEntity).toEqual({
          total: 6,
          hasMore: false,
          cursor: null,
          items: [],
        });
        expect(errors).toBeUndefined();
      }));

  it('should fail to paginatedEntity: invalid input argument', async () =>
    fetch(
      url,
      fetchConfig({
        operationName: 'PaginatedEntity',
        query: PAGINATED_ENTITY,
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

  it('should fail to paginatedEntity: invalid input argument', async () =>
    fetch(
      url,
      fetchConfig({
        operationName: 'PaginatedEntity',
        query: PAGINATED_ENTITY,
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
        expect(data?.paginatedEntity).toEqual({
          cursor: null,
          hasMore: false,
          items: [],
          total: 0,
        });
        expect(errors).toBeUndefined();
      }));

  it('should paginatedEntity, cursor=0', async () =>
    fetch(
      url,
      fetchConfig({
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
        expect(data?.paginatedEntity.hasMore).toEqual(true);
        expect(data?.paginatedEntity.cursor).toEqual(2);
        expect(data?.paginatedEntity.items.map(({ id }) => id)).toEqual([
          'paginated-1',
          'paginated-2',
        ]);
        expect(errors).toBeUndefined();
      }));

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
});

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
