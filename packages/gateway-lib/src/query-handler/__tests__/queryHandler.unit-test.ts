require('dotenv').config({ path: './.env.test' });
import { counterReducer, isCommit, QueryHandler } from '@fabric-es/fabric-cqrs';
import { enrollAdmin } from '@fabric-es/operator';
import { ApolloServer } from 'apollo-server';
import { Wallets } from 'fabric-network';
import type { Redis, RedisOptions } from 'ioredis';
import keys from 'lodash/keys';
import omit from 'lodash/omit';
import values from 'lodash/values';
import fetch from 'node-fetch';
import rimraf from 'rimraf';
import { createQueryHandlerService, rebuildIndex } from '..';
import type { MetaEntity } from '../../types';
import { getLogger } from '../../utils';
import {
  CREATE_COMMIT,
  FULL_TXT_SEARCH_COMMIT,
  FULL_TXT_SEARCH_ENTITY,
  ME,
  META_GET_ENTITY_BY_ENTNAME_ID,
} from '../query';

/**
 * ./dn-run.1-px-db-red-auth.sh or ./dn-run.2-px-db-red-auth.sh
 */

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

// p.s. tag in redis cannot use '-'. Later, need to check what else character are prohibited.
const tag = 'unit_test,gw_lib,query_handler';

let server: ApolloServer;
let queryHandler: QueryHandler;
let publisher: Redis;

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
      console.log(`tear-down: command_deleteByEntityId, ${entityName}:${id}, status: ${status}`)
    );

  await server.stop();

  return new Promise((done) => setTimeout(() => done(), 2000));
});

describe('QuerHandler Service Test', () => {
  it('should me', async () =>
    fetch(`http://localhost:${QH_PORT}/graphql`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `bearer no token` },
      body: JSON.stringify({ operationName: 'Me', query: ME }),
    })
      .then((r) => r.json())
      .then(({ data }) => expect(data?.me).toEqual('Hello')));

  it('should fail to createCommit: invalid input payload string', async () =>
    fetch(`http://localhost:${QH_PORT}/graphql`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `bearer no token` },
      body: JSON.stringify({
        operationName: 'CreateCommit',
        query: CREATE_COMMIT,
        variables: {
          entityName,
          id,
          type: 'Increment',
          payloadString: `{"id":"${id}"dfsafdqh-unit-test"}`,
        },
      }),
    })
      .then((r) => r.json())
      .then(({ data, errors }) => {
        expect(data?.createCommit).toBeNull();
        expect(errors[0].message).toContain('SyntaxError: Unexpected token d in JSON');
      }));

  it('should createCommit', async () =>
    fetch(`http://localhost:${QH_PORT}/graphql`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `bearer no token` },
      body: JSON.stringify({
        operationName: 'CreateCommit',
        query: CREATE_COMMIT,
        variables: {
          entityName,
          id,
          type: 'Increment',
          payloadString: `{"id":"${id}","desc":"my desc","tag":"${tag}"}`,
        },
      }),
    })
      .then((r) => r.json())
      .then(({ data }) => {
        const commit = data?.createCommit;
        if (isCommit(commit)) {
          expect(commit.id).toEqual(id);
          expect(commit.entityName).toEqual(entityName);
          expect(commit.version).toEqual(0);
        } else return false;
      }));
});

describe('Full Text Search Test', () => {
  beforeAll(() => new Promise((done) => setTimeout(() => done(), 4000)));

  it('should fail to fullTextSearchCommit: garbage input', async () =>
    fetch(`http://localhost:${QH_PORT}/graphql`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `bearer no token` },
      body: JSON.stringify({
        operationName: 'FullTextSearchCommit',
        query: FULL_TXT_SEARCH_COMMIT,
        variables: { query: 'xyz' },
      }),
    })
      .then((r) => r.json())
      .then(({ data }) => expect(data?.fullTextSearchCommit).toBeNull()));

  it('should fullTextSearchCommit: search by coun*, entityName wildcard', async () =>
    fetch(`http://localhost:${QH_PORT}/graphql`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `bearer no token` },
      body: JSON.stringify({
        operationName: 'FullTextSearchCommit',
        query: FULL_TXT_SEARCH_COMMIT,
        variables: { query: 'counter*' },
      }),
    })
      .then((r) => r.json())
      .then(({ data }) => {
        const commit = data?.fullTextSearchCommit;
        if (isCommit(commit)) {
          expect(commit.id).toEqual(id);
          expect(commit.entityName).toEqual(entityName);
          expect(commit.version).toEqual(0);
        } else return false;
      }));

  it('should fullTextSearchCommit: search by tag, @event:{increment}', async () =>
    fetch(`http://localhost:${QH_PORT}/graphql`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `bearer no token` },
      body: JSON.stringify({
        operationName: 'FullTextSearchCommit',
        query: FULL_TXT_SEARCH_COMMIT,
        variables: { query: '@event:{increment}' },
      }),
    })
      .then((r) => r.json())
      .then(({ data }) => {
        const commit = data?.fullTextSearchCommit;
        if (isCommit(commit)) {
          expect(commit.id).toEqual(id);
          expect(commit.entityName).toEqual(entityName);
          expect(commit.version).toEqual(0);
        } else return false;
      }));

  it('should fail to fullTextSearchEntity: garbage input', async () =>
    fetch(`http://localhost:${QH_PORT}/graphql`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `bearer no token` },
      body: JSON.stringify({
        operationName: 'FullTextSearchEntity',
        query: FULL_TXT_SEARCH_ENTITY,
        variables: { query: 'xyz' },
      }),
    })
      .then((r) => r.json())
      .then(({ data }) => expect(data?.fullTextSearchEntity).toBeNull()));

  it('should fullTextSearchEntity: search by entityId wildcard', async () =>
    fetch(`http://localhost:${QH_PORT}/graphql`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `bearer no token` },
      body: JSON.stringify({
        operationName: 'FullTextSearchEntity',
        query: FULL_TXT_SEARCH_ENTITY,
        variables: { query: 'qh_gql*' },
      }),
    })
      .then((r) => r.json())
      .then(({ data }) => {
        const counterObject: MetaEntity = data?.fullTextSearchEntity[0];
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
    fetch(`http://localhost:${QH_PORT}/graphql`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `bearer no token` },
      body: JSON.stringify({
        operationName: 'FullTextSearchEntity',
        query: FULL_TXT_SEARCH_ENTITY,
        variables: { query: '@tag:{query*}' },
      }),
    })
      .then((r) => r.json())
      .then(({ data }) => {
        const counterObject: MetaEntity = data?.fullTextSearchEntity[0];
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
    for await (const i of [1, 2, 3, 4, 5])
      await fetch(`http://localhost:${QH_PORT}/graphql`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: `bearer no token` },
        body: JSON.stringify({
          operationName: 'CreateCommit',
          query: CREATE_COMMIT,
          variables: {
            entityName,
            id: `paginated-${i}`,
            type: 'Increment',
            payloadString: `{"id":"paginated-${i}","desc":"my desc paginated-${i}","tag":"paginated_${i}"}`,
          },
        }),
      })
        .then((r) => r.text())
        .then((data) => console.log(data));

    return new Promise((done) => setTimeout(() => done(), 2000));
  });

  it('should metaGetEntityByEntNameEntId, cursor=10, out-of-range', async () =>
    fetch(`http://localhost:${QH_PORT}/graphql`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `bearer no token` },
      body: JSON.stringify({
        operationName: 'MetaGetByEntNameEntId',
        query: META_GET_ENTITY_BY_ENTNAME_ID,
        variables: {
          cursor: 10,
          pagesize: 2,
          entityName,
          sortByField: 'id',
          sort: 'ASC',
        },
      }),
    })
      .then((r) => r.json())
      .then(({ data, error }) => {
        expect(data?.metaGetByEntNameEntId).toEqual([]);
        expect(error).toBeUndefined();
      }));

  it('should fail to metaGetEntityByEntNameEntId: invalid input argument', async () =>
    fetch(`http://localhost:${QH_PORT}/graphql`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `bearer no token` },
      body: JSON.stringify({
        operationName: 'MetaGetByEntNameEntId',
        query: META_GET_ENTITY_BY_ENTNAME_ID,
        variables: {
          cursor: 0,
          pagesize: 2,
          entityName,
          sortByField: 'non-exist field',
          sort: 'ASC',
        },
      }),
    })
      .then((r) => r.json())
      .then(({ data, error }) => {
        expect(data?.metaGetByEntNameEntId).toBeNull();
        expect(error).toBeUndefined();
      }));

  it('should fail to metaGetEntityByEntNameEntId: invalid input argument', async () =>
    fetch(`http://localhost:${QH_PORT}/graphql`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `bearer no token` },
      body: JSON.stringify({
        operationName: 'MetaGetByEntNameEntId',
        query: META_GET_ENTITY_BY_ENTNAME_ID,
        variables: {
          cursor: 0,
          pagesize: 2,
          entityName: 'noop',
          sortByField: 'id',
          sort: 'ASC',
        },
      }),
    })
      .then((r) => r.json())
      .then(({ data, error }) => {
        expect(data?.metaGetByEntNameEntId).toBeNull();
        expect(error).toBeUndefined();
      }));

  it('should metaGetEntityByEntNameEntId, cursor=0', async () =>
    fetch(`http://localhost:${QH_PORT}/graphql`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `bearer no token` },
      body: JSON.stringify({
        operationName: 'MetaGetByEntNameEntId',
        query: META_GET_ENTITY_BY_ENTNAME_ID,
        variables: {
          cursor: 0,
          pagesize: 2,
          entityName,
          sortByField: 'id',
          sort: 'ASC',
        },
      }),
    })
      .then((r) => r.json())
      .then(({ data, error }) => {
        const entities: MetaEntity[] = data?.metaGetByEntNameEntId;
        expect(entities.length).toEqual(2);
        expect(entities.map(({ id }) => id)).toEqual(['paginated-1', 'paginated-2']);
        expect(error).toBeUndefined();
      }));

  it('should metaGetEntityByEntNameEntId, cursor=3', async () =>
    fetch(`http://localhost:${QH_PORT}/graphql`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `bearer no token` },
      body: JSON.stringify({
        operationName: 'MetaGetByEntNameEntId',
        query: META_GET_ENTITY_BY_ENTNAME_ID,
        variables: {
          cursor: 2,
          pagesize: 2,
          entityName,
          sortByField: 'id',
          sort: 'ASC',
        },
      }),
    })
      .then((r) => r.json())
      .then(({ data, error }) => {
        const entities: MetaEntity[] = data?.metaGetByEntNameEntId;
        expect(entities.length).toEqual(2);
        expect(entities.map(({ id }) => id)).toEqual(['paginated-3', 'paginated-4']);
        expect(error).toBeUndefined();
      }));
});
