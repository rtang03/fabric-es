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
import values from 'lodash/values';
import fetch from 'node-fetch';
import rimraf from 'rimraf';
import { createQueryHandlerService } from '..';
import { isBaseEvent, isLoginResponse, waitForSecond } from '../../utils';
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
const entityName = 'gw-gh-counter';
const id = `qh_gql_test_counter_001`;
const mspId = process.env.MSPID;
const proxyServerUri = process.env.PROXY_SERVER;
const orgAdminId = process.env.ORG_ADMIN_ID;
const orgAdminSecret = process.env.ORG_ADMIN_SECRET;
const timestampesOnCreate = [];
const walletPath = process.env.WALLET;
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
      reducers: { [entityName]: counterReducer },
      wallet: await Wallets.newFileSystemWallet(process.env.WALLET),
    })
      // define the Redisearch index, and selectors for Counter
      .addRedisRepository<Counter, CounterInRedis, OutputCounter>({
        entityName,
        fields: counterIndexDefinition,
        postSelector: counterPostSelector,
        preSelector: counterPreSelector,
      })
      // 1. connect Fabric; 2. recreate Indexes; 3. subscribe channel hub; 4. reconcile
      .run();

    server = qhService.getServer();
    queryHandler = qhService.getQueryHandler();
    redisRepos = qhService.getRedisRepos();

    // clean-up before tests
    const { data } = await queryHandler.command_getByEntityName(entityName)();
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
  await queryHandler
    .query_deleteEntityByEntityName(entityName)()
    .then(({ status }) =>
      console.log(`tear-down: query_deleteEntityByEntityName, ${entityName}, status: ${status}`)
    );

  await queryHandler
    .query_deleteCommitByEntityName(entityName)()
    .then(({ status }) =>
      console.log(`tear-down: query_deleteCommitByEntityName, ${entityName}, status: ${status}`)
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
          expect(commit.version).toBe(0);
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
        expect(data?.fullTextSearchCommit.total).toBe(1);
        expect(data?.fullTextSearchCommit.hasMore).toBeFalsy();
        expect(data?.fullTextSearchCommit.cursor).toBe(1);
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
          expect(commit.version).toBe(0);
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
        expect(data?.fullTextSearchEntity.total).toBe(1);
        expect(data?.fullTextSearchEntity.hasMore).toBeFalsy();
        expect(data?.fullTextSearchEntity.cursor).toBe(1);
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
        expect(data?.fullTextSearchEntity.total).toBe(1);
        expect(data?.fullTextSearchEntity.hasMore).toBeFalsy();
        expect(data?.fullTextSearchEntity.cursor).toBe(1);
        data?.fullTextSearchEntity.items.forEach((item) =>
          expect(isOutputCounter(item)).toBeTruthy()
        );
      }));
});

describe('Paginated search', () => {
  beforeAll(async () => {
    for await (const i of [1, 2, 3, 4, 5]) {
      timestampesOnCreate.push(Math.floor(Date.now()));

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
          param: '{"sortBy":{"sort":"ASC","field":"ts"}}',
        },
      })
    )
      .then((r) => r.json())
      .then(({ data, errors }) => {
        expect(data?.fullTextSearchEntity.total).toBe(5);
        expect(data?.fullTextSearchEntity.hasMore).toBeTruthy();
        expect(data?.fullTextSearchEntity.cursor).toBe(2);
        expect(data?.fullTextSearchEntity.items.map(({ id }) => id)).toEqual([
          'paginated-1',
          'paginated-2',
        ]);
        expect(errors).toBeUndefined();
      }));

  it('should paginatedEntity, cursor=3 (total is 5)', async () =>
    fetch(
      url,
      fetchConfig({
        operationName: 'FullTextSearchEntity',
        query: FULL_TXT_SEARCH_ENTITY,
        variables: {
          cursor: 3,
          pagesize: 2,
          entityName,
          query: '@id:paginated*',
          param: '{"sortBy":{"sort":"ASC","field":"ts"}}',
        },
      })
    )
      .then((r) => r.json())
      .then(({ data, errors }) => {
        expect(data?.fullTextSearchEntity.total).toBe(5);
        expect(data?.fullTextSearchEntity.hasMore).toBeFalsy();
        expect(data?.fullTextSearchEntity.cursor).toBe(5);
        expect(data?.fullTextSearchEntity.items.map(({ id }) => id)).toEqual([
          'paginated-4',
          'paginated-5',
        ]);
        expect(errors).toBeUndefined();
      }));

  it('should paginated Entity, last item: cursor=4 (total is 5)', async () =>
    fetch(
      url,
      fetchConfig({
        operationName: 'FullTextSearchEntity',
        query: FULL_TXT_SEARCH_ENTITY,
        variables: {
          cursor: 4,
          pagesize: 2,
          entityName,
          query: '@id:paginated*',
          param: '{"sortBy":{"sort":"ASC","field":"ts"}}',
        },
      })
    )
      .then((r) => r.json())
      .then(({ data, errors }) => {
        expect(data?.fullTextSearchEntity.total).toBe(5);
        expect(data?.fullTextSearchEntity.hasMore).toBeFalsy();
        expect(data?.fullTextSearchEntity.cursor).toBe(5);
        expect(data?.fullTextSearchEntity.items.map(({ id }) => id)).toEqual(['paginated-5']);
        expect(errors).toBeUndefined();
      }));

  it('should paginated Entity, by time range of field "created"', async () =>
    fetch(
      url,
      fetchConfig({
        operationName: 'FullTextSearchEntity',
        query: FULL_TXT_SEARCH_ENTITY,
        variables: {
          cursor: 0,
          pagesize: 10,
          entityName,
          query: `@id:paginated* @created:[${timestampesOnCreate[1]} ${timestampesOnCreate[3]}]`,
          param: '{"sortBy":{"sort":"ASC","field":"ts"}}',
        },
      })
    )
      .then((r) => r.json())
      .then(({ data, errors }) => {
        expect(data?.fullTextSearchEntity.total).toBe(2);
        expect(data?.fullTextSearchEntity.hasMore).toBeFalsy();
        expect(data?.fullTextSearchEntity.cursor).toBe(2);
        expect(data?.fullTextSearchEntity.items.map(({ id }) => id)).toEqual([
          'paginated-2',
          'paginated-3',
        ]);
        expect(errors).toBeUndefined();
      }));

  it('should paginated Entity, when field "created" > specific time', async () =>
    fetch(
      url,
      fetchConfig({
        operationName: 'FullTextSearchEntity',
        query: FULL_TXT_SEARCH_ENTITY,
        variables: {
          cursor: 0,
          pagesize: 10,
          entityName,
          query: `@id:paginated* @created:[${timestampesOnCreate[1]} inf]`,
          param: '{"sortBy":{"sort":"ASC","field":"ts"}}',
        },
      })
    )
      .then((r) => r.json())
      .then(({ data, errors }) => {
        expect(data?.fullTextSearchEntity.total).toBe(4);
        expect(data?.fullTextSearchEntity.hasMore).toBeFalsy();
        expect(data?.fullTextSearchEntity.cursor).toBe(4);
        expect(data?.fullTextSearchEntity.items.map(({ id }) => id)).toEqual([
          'paginated-2',
          'paginated-3',
          'paginated-4',
          'paginated-5',
        ]);
        expect(errors).toBeUndefined();
      }));

  it('should paginated Entity, when field "created" < specific time', async () =>
    fetch(
      url,
      fetchConfig({
        operationName: 'FullTextSearchEntity',
        query: FULL_TXT_SEARCH_ENTITY,
        variables: {
          cursor: 0,
          pagesize: 10,
          entityName,
          query: `@id:paginated* @created:[0 ${timestampesOnCreate[3]}]`,
          param: '{"sortBy":{"sort":"ASC","field":"ts"}}',
        },
      })
    )
      .then((r) => r.json())
      .then(({ data, errors }) => {
        expect(data?.fullTextSearchEntity.total).toBe(3);
        expect(data?.fullTextSearchEntity.hasMore).toBeFalsy();
        expect(data?.fullTextSearchEntity.cursor).toBe(3);
        expect(data?.fullTextSearchEntity.items.map(({ id }) => id)).toEqual([
          'paginated-1',
          'paginated-2',
          'paginated-3',
        ]);
        expect(errors).toBeUndefined();
      }));

  // when searching out-of-range, the other search criteria remains valid.
  // therefore, it is not returning null, and total is also valid
  it('should paginated Commit, cursor=10, out-of-range', async () =>
    fetch(
      url,
      fetchConfig({
        operationName: 'FullTextSearchCommit',
        query: FULL_TXT_SEARCH_COMMIT,
        variables: {
          cursor: 10,
          pagesize: 2,
          query: '@id:paginated*',
        },
      })
    )
      .then((r) => r.json())
      .then(({ data, errors }) => {
        expect(data?.fullTextSearchCommit).toEqual({
          total: 5,
          hasMore: false,
          cursor: null,
          items: [],
        });
        expect(errors).toBeUndefined();
      }));

  it('should paginated Commit, cursor=0', async () =>
    fetch(
      url,
      fetchConfig({
        operationName: 'FullTextSearchCommit',
        query: FULL_TXT_SEARCH_COMMIT,
        variables: {
          cursor: 0,
          pagesize: 2,
          query: '@id:paginated*',
          param: '{"sortBy":{"sort":"ASC","field":"ts"}}',
        },
      })
    )
      .then((r) => r.json())
      .then(({ data, errors }) => {
        expect(data?.fullTextSearchCommit.total).toBe(5);
        expect(data?.fullTextSearchCommit.hasMore).toBeTruthy();
        expect(data?.fullTextSearchCommit.cursor).toBe(2);
        expect(data?.fullTextSearchCommit.items.map(({ id }) => id)).toEqual([
          'paginated-1',
          'paginated-2',
        ]);
        expect(errors).toBeUndefined();
      }));

  it('should paginated Commit, cursor=3', async () =>
    fetch(
      url,
      fetchConfig({
        operationName: 'FullTextSearchCommit',
        query: FULL_TXT_SEARCH_COMMIT,
        variables: {
          cursor: 3,
          pagesize: 2,
          query: '@id:paginated*',
          param: '{"sortBy":{"sort":"ASC","field":"ts"}}',
        },
      })
    )
      .then((r) => r.json())
      .then(({ data, errors }) => {
        expect(data?.fullTextSearchCommit.total).toBe(5);
        expect(data?.fullTextSearchCommit.hasMore).toBeFalsy();
        expect(data?.fullTextSearchCommit.cursor).toBe(5);
        expect(data?.fullTextSearchCommit.items.map(({ id }) => id)).toEqual([
          'paginated-4',
          'paginated-5',
        ]);
        expect(errors).toBeUndefined();
      }));

  it('should paginated Commit, cursor=4', async () =>
    fetch(
      url,
      fetchConfig({
        operationName: 'FullTextSearchCommit',
        query: FULL_TXT_SEARCH_COMMIT,
        variables: {
          cursor: 4,
          pagesize: 2,
          query: '@id:paginated*',
          param: '{"sortBy":{"sort":"ASC","field":"ts"}}',
        },
      })
    )
      .then((r) => r.json())
      .then(({ data, errors }) => {
        expect(data?.fullTextSearchCommit.total).toBe(5);
        expect(data?.fullTextSearchCommit.hasMore).toBeFalsy();
        expect(data?.fullTextSearchCommit.cursor).toBe(5);
        expect(data?.fullTextSearchCommit.items.map(({ id }) => id)).toEqual(['paginated-5']);
        expect(errors).toBeUndefined();
      }));

  it('should paginated Commit, cursor=5', async () =>
    fetch(
      url,
      fetchConfig({
        operationName: 'FullTextSearchCommit',
        query: FULL_TXT_SEARCH_COMMIT,
        variables: {
          cursor: 5,
          pagesize: 2,
          query: '@id:paginated*',
          param: '{"sortBy":{"sort":"ASC","field":"ts"}}',
        },
      })
    )
      .then((r) => r.json())
      .then(({ data, errors }) => {
        expect(data?.fullTextSearchCommit.total).toBe(5);
        expect(data?.fullTextSearchCommit.hasMore).toBeFalsy();
        expect(data?.fullTextSearchCommit.cursor).toBeNull();
        expect(data?.fullTextSearchCommit.items).toEqual([]);
        expect(errors).toBeUndefined();
      }));

  it('should paginated Commit, event=Increment', async () =>
    fetch(
      url,
      fetchConfig({
        operationName: 'FullTextSearchCommit',
        query: FULL_TXT_SEARCH_COMMIT,
        variables: {
          cursor: 0,
          pagesize: 2,
          query: '@id:paginated* @event:{increment}',
          param: '{"sortBy":{"sort":"ASC","field":"ts"}}',
        },
      })
    )
      .then((r) => r.json())
      .then(({ data, errors }) => {
        expect(data?.fullTextSearchCommit.total).toBe(3);
        expect(data?.fullTextSearchCommit.hasMore).toBeTruthy();
        expect(data?.fullTextSearchCommit.cursor).toBe(2);
        expect(data?.fullTextSearchCommit.items.map(({ event }) => event)).toEqual([
          'Increment',
          'Increment',
        ]);
        expect(errors).toBeUndefined();
      }));

  it('should paginated Commit, by time range (ts)', async () =>
    fetch(
      url,
      fetchConfig({
        operationName: 'FullTextSearchCommit',
        query: FULL_TXT_SEARCH_COMMIT,
        variables: {
          cursor: 0,
          pagesize: 10,
          query: `@id:paginated* @ts:[${timestampesOnCreate[1]} ${timestampesOnCreate[3]}]`,
          param: '{"sortBy":{"sort":"ASC","field":"ts"}}',
        },
      })
    )
      .then((r) => r.json())
      .then(({ data, errors }) => {
        expect(data?.fullTextSearchCommit.total).toBe(2);
        expect(data?.fullTextSearchCommit.hasMore).toBeFalsy();
        expect(data?.fullTextSearchCommit.cursor).toBe(2);
        expect(data?.fullTextSearchCommit.items.map(({ id }) => id)).toEqual([
          'paginated-2',
          'paginated-3',
        ]);
        expect(errors).toBeUndefined();
      }));

  it('should paginated Commit, ts > specific time', async () =>
    fetch(
      url,
      fetchConfig({
        operationName: 'FullTextSearchCommit',
        query: FULL_TXT_SEARCH_COMMIT,
        variables: {
          cursor: 0,
          pagesize: 10,
          query: `@id:paginated* @ts:[${timestampesOnCreate[1]} inf]`,
          param: '{"sortBy":{"sort":"ASC","field":"ts"}}',
        },
      })
    )
      .then((r) => r.json())
      .then(({ data, errors }) => {
        expect(data?.fullTextSearchCommit.total).toBe(4);
        expect(data?.fullTextSearchCommit.hasMore).toBeFalsy();
        expect(data?.fullTextSearchCommit.cursor).toBe(4);
        expect(data?.fullTextSearchCommit.items.map(({ id }) => id)).toEqual([
          'paginated-2',
          'paginated-3',
          'paginated-4',
          'paginated-5',
        ]);
        expect(errors).toBeUndefined();
      }));

  it('should paginated Commit, ts < specific time', async () =>
    fetch(
      url,
      fetchConfig({
        operationName: 'FullTextSearchCommit',
        query: FULL_TXT_SEARCH_COMMIT,
        variables: {
          cursor: 0,
          pagesize: 10,
          query: `@id:paginated* @ts:[0 ${timestampesOnCreate[1]}]`,
          param: '{"sortBy":{"sort":"ASC","field":"ts"}}',
        },
      })
    )
      .then((r) => r.json())
      .then(({ data, errors }) => {
        expect(data?.fullTextSearchCommit.total).toBe(1);
        expect(data?.fullTextSearchCommit.hasMore).toBeFalsy();
        expect(data?.fullTextSearchCommit.cursor).toBe(1);
        expect(data?.fullTextSearchCommit.items.map(({ id }) => id)).toEqual(['paginated-1']);
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
        expect(data.getNotification.read).toBeFalsy();
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
        variables: { entityName, query: 'qh_gql*' },
      })
    )
      .then((r) => r.json())
      .then(({ data, errors }) => {
        expect(data).toBeNull();
        expect(errors[0].message).toEqual('could not find user');
      }));
});
