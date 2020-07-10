require('dotenv').config({ path: './.env.dev' });
import { enrollAdmin } from '@fabric-es/operator';
import { Wallets } from 'fabric-network';
import Redis from 'ioredis';
import omit from 'lodash/omit';
import rimraf from 'rimraf';
import {
  commitIndex,
  CounterEvent,
  createQueryDatabase,
  createQueryHandler,
  entityIndex,
} from '..';
import { getNetwork } from '../../services';
import type { Commit, QueryHandler } from '../../types';
import { Counter, reducer } from '../../unit-test-reducer';
import { isCommit, isCommitRecord, waitForSecond } from '../../utils';

/**
 * ./dn-run.1-db-red-auth.sh
 */

const caAdmin = process.env.CA_ENROLLMENT_ID_ADMIN;
const caAdminPW = process.env.CA_ENROLLMENT_SECRET_ADMIN;
const caUrl = process.env.ORG_CA_URL;
const channelName = process.env.CHANNEL_NAME;
const connectionProfile = process.env.CONNECTION_PROFILE;
const fabricNetwork = process.env.NETWORK_LOCATION;
const mspId = process.env.MSPID;
const orgAdminId = process.env.ORG_ADMIN_ID;
const orgAdminSecret = process.env.ORG_ADMIN_SECRET;
const walletPath = process.env.WALLET;
const entityName = 'test_subscribe';
const id = `qh_sub_test_001`;
const timestampesOnCreate = [];
const enrollmentId = orgAdminId;
const reducers = { [entityName]: reducer };
let redis: Redis.Redis;
let queryHandler: QueryHandler;

beforeAll(async () => {
  rimraf.sync(`${walletPath}/${orgAdminId}.id`);
  rimraf.sync(`${walletPath}/${caAdmin}.id`);

  try {
    const wallet = await Wallets.newFileSystemWallet(walletPath);

    // Step 1: EnrollAdmin
    await enrollAdmin({
      enrollmentID: orgAdminId,
      enrollmentSecret: orgAdminSecret,
      caUrl,
      connectionProfile,
      fabricNetwork,
      mspId,
      wallet,
    });

    // Step 2: EnrollCaAdmin
    await enrollAdmin({
      enrollmentID: caAdmin,
      enrollmentSecret: caAdminPW,
      caUrl,
      connectionProfile,
      fabricNetwork,
      mspId,
      wallet,
    });

    // localhost:6379
    redis = new Redis();
    const queryDatabase = createQueryDatabase(redis);

    const networkConfig = await getNetwork({
      discovery: true,
      asLocalhost: true,
      channelName,
      connectionProfile,
      wallet,
      enrollmentId,
    });

    queryHandler = createQueryHandler({
      entityNames: [entityName],
      gateway: networkConfig.gateway,
      network: networkConfig.network,
      queryDatabase,
      connectionProfile,
      channelName,
      wallet,
      reducers,
    });

    // tear down
    await queryHandler
      .command_deleteByEntityId(entityName)({ id })
      .then(({ data }) => console.log(data.message))
      .catch((e) => {
        console.error(e);
        process.exit(1);
      });

    await queryHandler
      .query_deleteCommitByEntityName(entityName)()
      .then(({ data }) => console.log(`${data} record(s) deleted`));

    await queryHandler.subscribeHub([entityName]);

    await redis
      .send_command('FT.DROP', ['cidx'])
      .then((result) => console.log(`cidx is dropped: ${result}`))
      .catch((result) => console.log(`cidx is not dropped: ${result}`));

    await redis
      .send_command('FT.CREATE', commitIndex)
      .then((result) => console.log(`cidx is created: ${result}`))
      .catch((result) => console.log(`cidx is not created: ${result}`));

    await redis
      .send_command('FT.DROP', ['eidx'])
      .then((result) => console.log(`eidx is dropped: ${result}`))
      .catch((result) => console.log(`eidx is not dropped: ${result}`));

    await redis
      .send_command('FT.CREATE', entityIndex)
      .then((result) => console.log(`eidx is created: ${result}`))
      .catch((result) => console.log(`eidx is not created: ${result}`));

    return waitForSecond(3);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
});

afterAll(async () => {
  queryHandler.unsubscribeHub();

  // clean up
  await redis
    .send_command('FT.DROP', ['cidx'])
    .then((result) => console.log(`cidx is dropped: ${result}`))
    .catch((result) => console.log(`cidx is not dropped: ${result}`));

  await redis
    .send_command('FT.DROP', ['eidx'])
    .then((result) => console.log(`eidx is dropped: ${result}`))
    .catch((result) => console.log(`eidx is not dropped: ${result}`));

  await queryHandler
    .query_deleteCommitByEntityName(entityName)()
    .then(({ data }) => console.log(`${data} records deleted`))
    .catch((error) => console.log(error));

  return waitForSecond(1);
});

describe('Query Handler Tests', () => {
  it('should create #1 record for id', async () =>
    queryHandler
      .create<CounterEvent>(entityName)({ enrollmentId, id })
      .save({
        events: [
          {
            type: 'Increment',
            payload: { id, desc: 'query handler #1 sub-test', tag: 'subcription' },
          },
        ],
      })
      .then(({ data }) => expect(isCommit(data)).toBeTruthy()));

  it('should query_getCommitById', async () =>
    queryHandler
      .getCommitById(entityName)({ id })
      .then(({ data }) => {
        data.forEach((commit) => {
          expect(commit.entityName).toEqual(entityName);
          expect(commit.id).toEqual(id);
          expect(isCommit(commit)).toBeTruthy();
        });
      }));

  it('should create #2 record for id', async () =>
    queryHandler
      .create<CounterEvent>(entityName)({ enrollmentId, id })
      .save({
        events: [
          {
            type: 'Decrement',
            payload: { id, desc: 'query hander #2 sub-test', tag: 'subscription' },
          },
        ],
      })
      .then(({ data }) => expect(isCommit(data)).toBeTruthy()));

  it('should FT.SEARCH by test* : return 2 commit', async () => {
    await waitForSecond(3);

    return queryHandler.fullTextSearchCommit(['test*'], 0, 2).then(({ data, status }) => {
      console.log(data.items);
      expect(status).toEqual('OK');
      expect(data.total).toEqual(2);
      expect(data.hasMore).toBeFalsy();
      expect(data.cursor).toEqual(2);
      expect(isCommitRecord(data.items)).toBeTruthy();
    });
  });

  it('should FT.SEARCH by qh* : return 2 commits', async () =>
    queryHandler.fullTextSearchCommit(['qh*'], 0, 2).then(({ data, status }) => {
      expect(status).toEqual('OK');
      expect(data.total).toEqual(2);
      expect(data.hasMore).toBeFalsy();
      expect(data.cursor).toEqual(2);
      expect(isCommitRecord(data.items)).toBeTruthy();
    }));

  it('should FT.SEARCH by @event:{increment} : return 1 commit', async () =>
    queryHandler.fullTextSearchCommit(['@event:{increment}'], 0, 2).then(({ data, status }) => {
      expect(status).toEqual('OK');
      expect(data.total).toEqual(1);
      expect(data.hasMore).toBeFalsy();
      expect(data.cursor).toEqual(1);
      expect(data.items[0].events[0].type).toEqual('Increment');
      expect(isCommitRecord(data.items)).toBeTruthy();
    }));

  it('should FT.SEARCH by @msp:{org1msp} : return 2 commit', async () =>
    queryHandler.fullTextSearchCommit(['@msp:{org1msp}'], 0, 2).then(({ data, status }) => {
      expect(status).toEqual('OK');
      expect(data.total).toEqual(2);
      expect(data.hasMore).toBeFalsy();
      expect(data.cursor).toEqual(2);
      expect(data.items[0].events[0].type).toEqual('Decrement');
      expect(data.items[0].mspId).toEqual('Org1MSP');
      expect(isCommitRecord(data.items)).toBeTruthy();
    }));

  it('should fail to FT.SEARCH: invalid input;', async () =>
    queryHandler
      .fullTextSearchCommit(['kljkljkljjkljklj;jkl;'], 0, 2)
      .then(({ data, status, error, message }) => {
        expect(status).toEqual('ERROR');
        expect(data).toBeUndefined();
        expect(error).toContain('Syntax error at offset');
      }));

  it('should FT.SEARCH by test* : return 1 entity', async () =>
    queryHandler.fullTextSearchEntity(['test*'], 0, 2).then(({ data, status }) => {
      expect(status).toEqual('OK');
      expect(data.total).toEqual(1);
      expect(data.hasMore).toBeFalsy();
      expect(data.cursor).toEqual(1);
      expect(omit(data.items[0], '_ts', '_created', '_commit', '_timeline')).toEqual({
        id,
        value: 0,
        tag: 'subscription',
        desc: 'query hander #2 sub-test',
        _creator: 'admin-org1.net',
        _event: 'Increment,Decrement',
        _entityName: entityName,
        _organization: ['Org1MSP'],
      });
    }));

  it('should FT.SEARCH by tag:{org} : return 1 entity', async () =>
    queryHandler.fullTextSearchEntity(['@org:{org1msp}'], 0, 2).then(({ data, status }) => {
      expect(status).toEqual('OK');
      expect(data.total).toEqual(1);
      expect(data.hasMore).toBeFalsy();
      expect(data.cursor).toEqual(1);
      expect(omit(data.items[0], '_ts', '_created', '_commit', '_timeline')).toEqual({
        id,
        value: 0,
        tag: 'subscription',
        desc: 'query hander #2 sub-test',
        _creator: 'admin-org1.net',
        _event: 'Increment,Decrement',
        _entityName: entityName,
        _organization: ['Org1MSP'],
      });
    }));

  it('should queryGetEntityInfo', async () =>
    queryHandler.queryGetEntityInfo({ entityName: 'noop' }).then(({ data, status }) => {
      expect(status).toEqual('OK');
      expect(data).toEqual({
        total: 0,
        tagged: [],
        orgs: [],
        creators: [],
        events: [],
        totalCommit: 0,
      });
    }));

  it('should queryGetEntityInfo', async () =>
    queryHandler.queryGetEntityInfo({ entityName }).then(({ data, status }) => {
      expect(status).toEqual('OK');
      expect(data).toEqual({
        total: 1,
        tagged: ['subscription'],
        orgs: ['Org1MSP'],
        creators: ['admin-org1.net'],
        events: ['Increment', 'Decrement'],
        totalCommit: 2,
      });
    }));
});

describe('Pagination tests for getPaginatedEntityById', () => {
  beforeAll(async () => {
    for await (const i of [1, 2, 3, 4, 5]) {
      timestampesOnCreate.push(Math.floor(Date.now() / 1000));

      await queryHandler
        .create<CounterEvent>(entityName)({ enrollmentId, id: `qh_pag_test_00${i}` })
        .save({
          events: [
            {
              type: i % 2 === 0 ? 'Increment' : 'Decrement',
              payload: {
                id: `qh_pag_test_00${i}`,
                desc: `#${i} pag-test`,
                tag: 'pagination,unit-test',
              },
            },
          ],
        });

      await waitForSecond(3);
    }
  });

  it('should getPaginatedEntityById: cursor=0, pagesize=2', async () =>
    queryHandler
      .getPaginatedEntityById<Counter>(entityName)({
        cursor: 0,
        pagesize: 2,
        sortByField: 'id',
        sort: 'ASC',
      })
      .then(({ data, status }) => {
        expect(status).toEqual('OK');
        expect(data.total).toEqual(6);
        expect(data.hasMore).toBeTruthy();
        expect(data.cursor).toEqual(2);
        expect(data.items.map(({ id, desc, tag, value }) => ({ id, desc, tag, value }))).toEqual([
          { id: 'qh_pag_test_001', desc: '#1 pag-test', tag: 'pagination,unit_test', value: -1 },
          { id: 'qh_pag_test_002', desc: '#2 pag-test', tag: 'pagination,unit_test', value: 1 },
        ]);
      }));

  it('should getPaginatedEntityById: cursor=1, pagesize=2', async () =>
    queryHandler
      .getPaginatedEntityById<Counter>(entityName)({
        cursor: 1,
        pagesize: 2,
        sortByField: 'id',
        sort: 'ASC',
      })
      .then(({ data, status }) => {
        expect(status).toEqual('OK');
        expect(data.total).toEqual(6);
        expect(data.hasMore).toBeTruthy();
        expect(data.cursor).toEqual(3);
        expect(data.items.map(({ id, desc, tag, value }) => ({ id, desc, tag, value }))).toEqual([
          { id: 'qh_pag_test_002', desc: '#2 pag-test', tag: 'pagination,unit_test', value: 1 },
          { id: 'qh_pag_test_003', desc: '#3 pag-test', tag: 'pagination,unit_test', value: -1 },
        ]);
      }));

  it('should getPaginatedEntityById: id=001, cursor=0, pagesize=2', async () =>
    queryHandler
      .getPaginatedEntityById<Counter>(entityName)(
        {
          cursor: 0,
          pagesize: 2,
          sortByField: 'id',
          sort: 'ASC',
        },
        'qh_pag_test_001'
      )
      .then(({ data, status }) => {
        expect(status).toEqual('OK');
        expect(data.total).toEqual(1);
        expect(data.hasMore).toBeFalsy();
        expect(data.cursor).toEqual(1);
        expect(data.items.map(({ id, desc, tag, value }) => ({ id, desc, tag, value }))).toEqual([
          { id: 'qh_pag_test_001', desc: '#1 pag-test', tag: 'pagination,unit_test', value: -1 },
        ]);
      }));

  it('should getPaginatedEntityById: cursor=0, pagesize=10', async () =>
    queryHandler
      .getPaginatedEntityById<Counter>(entityName)(
        {
          cursor: 0,
          pagesize: 10,
          sortByField: 'id',
          sort: 'ASC',
        },
        'qh_pag_test_00*'
      )
      .then(({ data, status }) => {
        expect(status).toEqual('OK');
        expect(data.total).toEqual(5);
        expect(data.hasMore).toBeFalsy();
        expect(data.cursor).toEqual(5);
        expect(data.items.map(({ id, desc, tag, value }) => ({ id, desc, tag, value }))).toEqual([
          { id: 'qh_pag_test_001', desc: '#1 pag-test', tag: 'pagination,unit_test', value: -1 },
          { id: 'qh_pag_test_002', desc: '#2 pag-test', tag: 'pagination,unit_test', value: 1 },
          { id: 'qh_pag_test_003', desc: '#3 pag-test', tag: 'pagination,unit_test', value: -1 },
          { id: 'qh_pag_test_004', desc: '#4 pag-test', tag: 'pagination,unit_test', value: 1 },
          { id: 'qh_pag_test_005', desc: '#5 pag-test', tag: 'pagination,unit_test', value: -1 },
        ]);
      }));

  it('should getPaginatedEntityById: cursor=0, scope=CREATED', async () =>
    queryHandler
      .getPaginatedEntityById<Counter>(entityName)(
        {
          scope: 'CREATED',
          startTime: timestampesOnCreate[1],
          endTime: timestampesOnCreate[3] + 1,
          cursor: 0,
          pagesize: 10,
          sortByField: 'id',
          sort: 'ASC',
        },
        'qh_pag_test_00*'
      )
      .then(({ data, status }) => {
        expect(status).toEqual('OK');
        expect(data.total).toEqual(3);
        expect(data.hasMore).toBeFalsy();
        expect(data.cursor).toEqual(3);
        expect(data.items.map(({ id, desc, tag, value }) => ({ id, desc, tag, value }))).toEqual([
          { id: 'qh_pag_test_002', desc: '#2 pag-test', tag: 'pagination,unit_test', value: 1 },
          { id: 'qh_pag_test_003', desc: '#3 pag-test', tag: 'pagination,unit_test', value: -1 },
          { id: 'qh_pag_test_004', desc: '#4 pag-test', tag: 'pagination,unit_test', value: 1 },
        ]);
      }));

  it('should getPaginatedEntityById: cursor=0, scope=LAST_MODIFIED', async () =>
    queryHandler
      .getPaginatedEntityById<Counter>(entityName)(
        {
          scope: 'LAST_MODIFIED',
          startTime: timestampesOnCreate[1],
          endTime: timestampesOnCreate[3] + 1,
          cursor: 0,
          pagesize: 10,
          sortByField: 'id',
          sort: 'ASC',
        },
        'qh_pag_test_00*'
      )
      .then(({ data, status }) => {
        expect(status).toEqual('OK');
        expect(data.total).toEqual(3);
        expect(data.hasMore).toBeFalsy();
        expect(data.cursor).toEqual(3);
        expect(data.items.map(({ id, desc, tag, value }) => ({ id, desc, tag, value }))).toEqual([
          { id: 'qh_pag_test_002', desc: '#2 pag-test', tag: 'pagination,unit_test', value: 1 },
          { id: 'qh_pag_test_003', desc: '#3 pag-test', tag: 'pagination,unit_test', value: -1 },
          { id: 'qh_pag_test_004', desc: '#4 pag-test', tag: 'pagination,unit_test', value: 1 },
        ]);
      }));

  it('should getPaginatedEntityById: creator=enrollmentId', async () =>
    queryHandler
      .getPaginatedEntityById<Counter>(entityName)(
        {
          cursor: 0,
          pagesize: 10,
          sortByField: 'id',
          sort: 'ASC',
          creator: enrollmentId,
        },
        'qh_pag_test_00*'
      )
      .then(({ data, status }) => {
        expect(status).toEqual('OK');
        expect(data.total).toEqual(5);
        expect(data.hasMore).toBeFalsy();
        expect(data.cursor).toEqual(5);
        expect(data.items.map(({ id, desc, tag, value }) => ({ id, desc, tag, value }))).toEqual([
          { id: 'qh_pag_test_001', desc: '#1 pag-test', tag: 'pagination,unit_test', value: -1 },
          { id: 'qh_pag_test_002', desc: '#2 pag-test', tag: 'pagination,unit_test', value: 1 },
          { id: 'qh_pag_test_003', desc: '#3 pag-test', tag: 'pagination,unit_test', value: -1 },
          { id: 'qh_pag_test_004', desc: '#4 pag-test', tag: 'pagination,unit_test', value: 1 },
          { id: 'qh_pag_test_005', desc: '#5 pag-test', tag: 'pagination,unit_test', value: -1 },
        ]);
      }));

  it('should getPaginatedCommitById: cursor=0, pagesize=2', async () =>
    queryHandler
      .getPaginatedCommitById(entityName)(
        { cursor: 0, pagesize: 2, sortByField: 'id', sort: 'ASC' },
        'qh_pag_test_00*'
      )
      .then(({ data, status }) => {
        expect(status).toEqual('OK');
        expect(data.total).toEqual(5);
        expect(data.hasMore).toBeTruthy();
        expect(data.cursor).toEqual(2);
        expect(data.items.map(({ id }) => id)).toEqual(['qh_pag_test_001', 'qh_pag_test_002']);
      }));

  it('should getPaginatedCommitById: cursor=1, pagesize=2', async () =>
    queryHandler
      .getPaginatedCommitById(entityName)(
        { cursor: 1, pagesize: 2, sortByField: 'id', sort: 'ASC' },
        'qh_pag_test_00*'
      )
      .then(({ data, status }) => {
        expect(status).toEqual('OK');
        expect(data.total).toEqual(5);
        expect(data.hasMore).toBeTruthy();
        expect(data.cursor).toEqual(3);
        expect(data.items.map(({ id }) => id)).toEqual(['qh_pag_test_002', 'qh_pag_test_003']);
      }));

  it('should getPaginatedCommitById: cursor=0, pagesize=10', async () =>
    queryHandler
      .getPaginatedCommitById(entityName)(
        { cursor: 0, pagesize: 10, sortByField: 'id', sort: 'ASC' },
        'qh_pag_test_00*'
      )
      .then(({ data, status }) => {
        expect(status).toEqual('OK');
        expect(data.total).toEqual(5);
        expect(data.hasMore).toBeFalsy();
        expect(data.cursor).toEqual(5);
        expect(data.items.map(({ id }) => id)).toEqual([
          'qh_pag_test_001',
          'qh_pag_test_002',
          'qh_pag_test_003',
          'qh_pag_test_004',
          'qh_pag_test_005',
        ]);
      }));

  it('should getPaginatedCommitById: events=increment', async () =>
    queryHandler
      .getPaginatedCommitById(entityName)(
        { cursor: 0, pagesize: 10, sortByField: 'id', sort: 'ASC', events: ['increment'] },
        'qh_pag_test_00*'
      )
      .then(({ data, status }) => {
        expect(status).toEqual('OK');
        expect(data.total).toEqual(2);
        expect(data.hasMore).toBeFalsy();
        expect(data.cursor).toEqual(2);
        expect(data.items.map(({ id }) => id)).toEqual(['qh_pag_test_002', 'qh_pag_test_004']);
      }));

  it('should getPaginatedCommitById: startTime/endTime', async () =>
    queryHandler
      .getPaginatedCommitById(entityName)(
        {
          cursor: 0,
          pagesize: 10,
          sortByField: 'id',
          sort: 'ASC',
          startTime: timestampesOnCreate[1],
          endTime: timestampesOnCreate[3] + 1,
        },
        'qh_pag_test_00*'
      )
      .then(({ data, status }) => {
        expect(status).toEqual('OK');
        expect(data.total).toEqual(3);
        expect(data.hasMore).toBeFalsy();
        expect(data.cursor).toEqual(3);
        expect(data.items.map(({ id }) => id)).toEqual([
          'qh_pag_test_002',
          'qh_pag_test_003',
          'qh_pag_test_004',
        ]);
      }));

  it('should getPaginatedCommitById: startTime/endTime', async () =>
    queryHandler
      .getPaginatedCommitById(entityName)(
        {
          cursor: 0,
          pagesize: 10,
          sortByField: 'id',
          sort: 'ASC',
          startTime: 0,
          endTime: timestampesOnCreate[1] + 1,
        },
        'qh_pag_test_00*'
      )
      .then(({ data, status }) => {
        expect(status).toEqual('OK');
        expect(data.total).toEqual(2);
        expect(data.hasMore).toBeFalsy();
        expect(data.cursor).toEqual(2);
        expect(data.items.map(({ id }) => id)).toEqual(['qh_pag_test_001', 'qh_pag_test_002']);
      }));

  it('should getPaginatedCommitById: creator=enrollmentId', async () =>
    queryHandler
      .getPaginatedCommitById(entityName)(
        { cursor: 0, pagesize: 10, sortByField: 'id', sort: 'ASC', creator: enrollmentId },
        'qh_pag_test_00*'
      )
      .then(({ data, status }) => {
        expect(status).toEqual('OK');
        expect(data.total).toEqual(5);
        expect(data.hasMore).toBeFalsy();
        expect(data.cursor).toEqual(5);
        expect(data.items.map(({ id }) => id)).toEqual([
          'qh_pag_test_001',
          'qh_pag_test_002',
          'qh_pag_test_003',
          'qh_pag_test_004',
          'qh_pag_test_005',
        ]);
      }));

  it('should getPaginatedCommitById: by single event', async () =>
    queryHandler
      .getPaginatedCommitById(entityName)(
        { cursor: 0, pagesize: 10, sortByField: 'id', sort: 'ASC', events: ['increment'] },
        'qh_pag_test_00*'
      )
      .then(({ data, status }) => {
        expect(status).toEqual('OK');
        expect(data.total).toEqual(2);
        expect(data.hasMore).toBeFalsy();
        expect(data.cursor).toEqual(2);
        expect(data.items.map(({ id }) => id)).toEqual(['qh_pag_test_002', 'qh_pag_test_004']);
      }));

  it('should getPaginatedCommitById: by events array', async () =>
    queryHandler
      .getPaginatedCommitById(entityName)(
        {
          cursor: 0,
          pagesize: 10,
          sortByField: 'id',
          sort: 'ASC',
          events: ['increment', 'decrement'],
        },
        'qh_pag_test_00*'
      )
      .then(({ data, status }) => {
        expect(status).toEqual('OK');
        expect(data.total).toEqual(5);
        expect(data.hasMore).toBeFalsy();
        expect(data.cursor).toEqual(5);
        expect(data.items.map(({ id }) => id)).toEqual([
          'qh_pag_test_001',
          'qh_pag_test_002',
          'qh_pag_test_003',
          'qh_pag_test_004',
          'qh_pag_test_005',
        ]);
      }));
});
