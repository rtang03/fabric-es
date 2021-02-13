require('dotenv').config({ path: './.env.dev' });
import { enrollAdmin } from '@fabric-es/operator';
import { Wallets } from 'fabric-network';
import omit from 'lodash/omit';
import { Redisearch } from 'redis-modules-sdk';
import rimraf from 'rimraf';
import { createRepository } from '..';
import { registerUser } from '../../account';
import {
  createQueryDatabase,
  createQueryHandler,
  createRedisRepository,
} from '../../queryHandler';
import type { OutputCommit, QueryHandler, RedisRepository } from '../../queryHandler/types';
import { getNetwork } from '../../services';
import type { Repository } from '../../types';
import {
  reducer,
  CounterEvent,
  Counter,
  OutputCounter,
  CounterInRedis,
  counterSearchDefinition as fields,
  postSelector,
  preSelector,
  isOutputCounter,
} from '../../unit-test-counter';
import { getLogger, waitForSecond } from '../../utils';

/**
 * ./dn-run.1-db-red-auth.sh
 */

let repo: Repository<Counter, CounterEvent>;
let commitId: string;
let client: Redisearch;
let commitRepo: RedisRepository<OutputCommit>;
let counterRedisRepo: RedisRepository<OutputCounter>;
let queryHandler: QueryHandler;

const caName = process.env.CA_NAME;
const channelName = process.env.CHANNEL_NAME;
const connectionProfile = process.env.CONNECTION_PROFILE;
const enrollmentId = `repo_tester_${Math.floor(Math.random() * 10000)}`;
const entityName = 'test_repo';
const id = `repo_test_counter_001`;
const logger = getLogger({ name: 'repo-unit.test.js' });
const mspId = process.env.MSPID;
const reducers = { [entityName]: reducer };
const timestampesOnCreate = [];
const events = [
  {
    type: 'Increment',
    payload: { id, desc: 'repo #1 create-test', tag: 'repo-test' },
  },
];

const firstVerification = ({ status, cursor, hasMore, total, items }) => {
  expect(status).toEqual('OK');
  expect(cursor).toBe(1);
  expect(hasMore).toBeFalsy();
  expect(total).toBe(1);
  const counter = items[0];
  expect(isOutputCounter(counter)).toBeTruthy();
  expect(omit(counter, 'createdAt', 'timestamp', 'creator')).toEqual({
    description: 'repo #2 create-test',
    eventInvolved: ['Increment', 'Increment'],
    id: 'repo_test_counter_001',
    tags: ['repo_test'],
    value: 2,
  });
};
const noResult = {
  status: 'OK',
  data: { total: 0, items: [], hasMore: false, cursor: null },
};

beforeAll(async () => {
  rimraf.sync(`${process.env.WALLET}/${process.env.ORG_ADMIN_ID}.id`);
  rimraf.sync(`${process.env.WALLET}/${process.env.CA_ENROLLMENT_ID_ADMIN}.id`);

  try {
    const wallet = await Wallets.newFileSystemWallet(process.env.WALLET);

    // Step 1: EnrollAdmin
    await enrollAdmin({
      connectionProfile,
      enrollmentID: process.env.ORG_ADMIN_ID,
      enrollmentSecret: process.env.ORG_ADMIN_SECRET,
      caName,
      mspId,
      wallet,
    });

    // Step 2: EnrollCaAdmin
    await enrollAdmin({
      connectionProfile,
      enrollmentID: process.env.CA_ENROLLMENT_ID_ADMIN,
      enrollmentSecret: process.env.CA_ENROLLMENT_SECRET_ADMIN,
      caName,
      mspId,
      wallet,
    });

    await registerUser({
      caAdmin: process.env.CA_ENROLLMENT_ID_ADMIN,
      caAdminPW: process.env.CA_ENROLLMENT_SECRET_ADMIN,
      caName,
      enrollmentId,
      enrollmentSecret: 'password',
      connectionProfile,
      wallet,
      mspId,
    });

    // Step 3: connect Redis
    client = new Redisearch({
      host: '127.0.0.1',
      port: 6379,
      retryStrategy: (times) => {
        if (times > 3) {
          // the 4th return will exceed 10 seconds, based on the return value...
          console.error(`Redis: connection retried ${times} times, exceeded 10 seconds.`);
          process.exit(-1);
        }
        return Math.min(times * 100, 3000); // reconnect after (ms)
      },
      reconnectOnError: (err) => {
        const targetError = 'READONLY';
        if (err.message.includes(targetError)) {
          // Only reconnect when the error contains "READONLY"
          return 1;
        }
      },
    });
    await client.connect();

    // Step 4: create counter's RedisRepo
    counterRedisRepo = createRedisRepository<Counter, CounterInRedis, OutputCounter>({
      client,
      fields,
      entityName,
      postSelector,
      preSelector,
    });

    // Step 5: create QueryDatabase
    const queryDatabase = createQueryDatabase(client, { [entityName]: counterRedisRepo });
    commitRepo = queryDatabase.getRedisCommitRepo();

    // Step 6: obtain network configuration of Hyperledger Fabric
    const { gateway, network } = await getNetwork({
      channelName,
      connectionProfile,
      wallet,
      enrollmentId,
      discovery: true,
      asLocalhost: true,
    });

    // Step 7: Repo
    repo = createRepository<Counter, CounterEvent>(entityName, reducer, {
      channelName,
      connectionProfile,
      queryDatabase,
      gateway,
      network,
      logger,
      wallet,
    });

    // Step 8: QueryHandler
    queryHandler = createQueryHandler({
      channelName,
      connectionProfile,
      entityNames: [entityName],
      gateway,
      network,
      queryDatabase,
      reducers,
      wallet,
    });

    // Step 9: prepare Redisearch indexes
    const eidx = counterRedisRepo.getIndexName();
    await counterRedisRepo
      .dropIndex()
      .then((result) => console.log(`${eidx} is dropped: ${result}`))
      .catch((result) => console.log(`${eidx} is not dropped: ${result}`));

    await counterRedisRepo
      .createIndex()
      .then((result) => console.log(`${eidx} is created: ${result}`));

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

    // Step 9: remove pre-existing records
    await repo.command_deleteByEntityId({ id }).then(({ status }) => console.log(status));

    for await (const i of [1, 2, 3, 4, 5])
      await repo
        .command_deleteByEntityId({ id: `repo_pag_test_0${i}` })
        .then(({ status }) => console.log(status));

    // invoke contract listener, AT LAST
    await queryHandler.subscribeHub([entityName]);
  } catch (e) {
    console.error('Bootstrap network error');
    console.error(e);
    process.exit(1);
  }
});

afterAll(async () => {
  // await repo
  //   .query_deleteCommitByEntityName()
  //   .then(({ data, status }) =>
  //     console.log(`${entityName}: ${data} record(s) deleted, status: ${status}`)
  //   );

  repo.disconnect();

  queryHandler.unsubscribeHub();
  return waitForSecond(2);
});

describe('Repository Test', () => {
  it('should get entityName', async () => repo.getEntityName() === entityName);

  it('should command_deleteByEntityId', async () =>
    repo.command_deleteByEntityId({ id }).then(({ data, status }) => {
      expect(status).toEqual('OK');
      expect(data?.status).toEqual('SUCCESS');
    }));

  it('should query_deleteByEntityId', async () =>
    repo.query_deleteCommitByEntityId({ id }).then(({ status }) => {
      expect(status).toEqual('OK');
    }));

  it('should command_create', async () => {
    await repo
      .create({ enrollmentId, id })
      .save({ events })
      .then(({ data, status }) => {
        expect(status).toEqual('OK');
        expect(data.id).toEqual(id);
        expect(data.entityName).toEqual(entityName);
        expect(data.version).toEqual(0);
        commitId = data.commitId;
      });

    return waitForSecond(10);
  });

  it('should verify result by command_getByEntityIdCommitId', async () =>
    repo.command_getByEntityIdCommitId({ id, commitId }).then(({ data, status }) => {
      expect(status).toEqual('OK');
      expect(data[0].entityName).toEqual(entityName);
      expect(data[0].id).toEqual(id);
      expect(data[0].version).toEqual(0);
    }));

  it('should query_getByEntityName', async () =>
    repo.getByEntityName().then(({ data, status }) => {
      expect(status).toEqual('OK');
      expect(omit(data[0], '_created', '_creator', '_ts')).toEqual({
        value: 1,
        id: 'repo_test_counter_001',
        desc: 'repo #1 create-test',
        tag: 'repo_test',
      });
    }));

  it('should query_getCommitById', async () =>
    repo.getCommitById({ id }).then(({ data, status }) => {
      expect(data.length).toEqual(1);
      expect(data[0].commitId).toEqual(commitId);
      expect(status).toEqual('OK');
      expect(data[0].id).toEqual(id);
      expect(data[0].entityName).toEqual(entityName);
      expect(data[0].version).toEqual(0);
    }));

  it('should getById, and then save new event', async () => {
    const { save, currentState } = await repo.getById({ enrollmentId, id });
    expect(omit(currentState, '_ts', '_creator', '_created')).toEqual({
      value: 1,
      id: 'repo_test_counter_001',
      desc: 'repo #1 create-test',
      tag: 'repo_test',
      _organization: ['Org1MSP'],
    });

    await save({
      events: [
        {
          type: 'Increment',
          payload: { id, desc: 'repo #2 create-test', tag: 'repo-test' },
        },
      ],
    }).then(({ status, data }) => {
      expect(status).toEqual('OK');
      expect(data.id).toEqual(id);
      expect(data.entityName).toEqual(entityName);
      expect(data.version).toEqual(1);
    });
  });
});

describe('Verify Result', () => {
  beforeAll(async () => waitForSecond(10));
  beforeEach(async () => waitForSecond(2));

  it('should verify result by getById, after #2 commit', async () =>
    repo.getById({ enrollmentId, id }).then(({ currentState: { value, desc } }) => {
      expect(value).toEqual(2);
      expect(desc).toEqual('repo #2 create-test');
    }));

  it('should verify result by query_getCommitById, after #2 commit', async () =>
    repo.getCommitById({ id }).then(({ data, status }) => {
      data
        .map((commit) => omit(commit, '_ts'))
        .forEach((commit) => {
          expect(commit.id).toEqual(id);
          expect(commit.entityName).toEqual(entityName);
        });
      expect(data.length).toEqual(2);
      expect(status).toEqual('OK');
    }));

  it('should verify result by query_getByEntityName, after #2 commit', async () =>
    repo.getByEntityName().then(({ data, status }) => {
      expect(status).toEqual('OK');
      expect(omit(data[0], '_ts', '_created', '_creator')).toEqual({
        value: 2,
        id: 'repo_test_counter_001',
        desc: 'repo #2 create-test',
        tag: 'repo_test',
      });
    }));

  it('should fail find by where: invalid id', async () =>
    repo
      .fullTextSearchEntity<OutputCounter>({
        entityName,
        query: `@id:abcdefg*`,
        cursor: 0,
        pagesize: 10,
      })
      .then((result) => expect(result).toEqual(noResult)));

  it('should find by entityId', async () =>
    repo
      .fullTextSearchEntity<OutputCounter>({
        entityName,
        query: `@id:${id}`,
        cursor: 0,
        pagesize: 10,
      })
      .then(({ data: { total, cursor, hasMore, items }, status }) =>
        firstVerification({ status, total, cursor, hasMore, items })
      ));

  it('should find by description', async () =>
    repo
      .fullTextSearchEntity<OutputCounter>({
        entityName,
        query: `@de:repo*`,
        cursor: 0,
        pagesize: 10,
      })
      .then(({ data: { total, cursor, hasMore, items }, status }) =>
        firstVerification({ status, total, cursor, hasMore, items })
      ));
});

describe('Paginated entity and commit Tests', () => {
  beforeAll(async () => {
    await waitForSecond(2);
    for await (const i of [1, 2, 3, 4, 5]) {
      timestampesOnCreate.push(Math.floor(Date.now() / 1000));

      await repo.create({ enrollmentId, id: `repo_pag_test_0${i}` }).save({
        events: [
          {
            type: i % 2 === 0 ? 'Decrement' : 'Increment',
            payload: {
              id: `repo_pag_test_0${i}`,
              desc: `#${i} pag-test`,
              tag: 'paginated,repo',
            },
          },
        ],
      });
      await waitForSecond(3);
    }
  });

  it('should do paginated commit search: cursor=0 pagesize=2', async () =>
    repo
      .fullTextSearchCommit({
        query: '@id:repo_pag_test*',
        cursor: 0,
        pagesize: 2,
        param: { sortBy: { field: 'ts', sort: 'ASC' } },
      })
      .then(({ status, data: { total, cursor, hasMore, items } }) => {
        expect(status).toEqual('OK');
        expect(total).toBe(5);
        expect(cursor).toBe(2);
        expect(hasMore).toBeTruthy();
        expect(items.map(({ id }) => id)).toEqual(['repo_pag_test_01', 'repo_pag_test_02']);
      }));

  it('should do paginated commit search: cursor=1 pagesize=2', async () =>
    repo
      .fullTextSearchCommit({
        query: '@id:repo_pag_test*',
        cursor: 1,
        pagesize: 2,
        param: { sortBy: { field: 'ts', sort: 'ASC' } },
      })
      .then(({ status, data: { total, cursor, hasMore, items } }) => {
        expect(status).toEqual('OK');
        expect(total).toBe(5);
        expect(cursor).toBe(3);
        expect(hasMore).toBeTruthy();
        expect(items.map(({ id }) => id)).toEqual(['repo_pag_test_02', 'repo_pag_test_03']);
      }));

  it('should do paginated commit search: cursor=2 pagesize=2', async () =>
    repo
      .fullTextSearchCommit({
        query: '@id:repo_pag_test*',
        cursor: 2,
        pagesize: 2,
        param: { sortBy: { field: 'ts', sort: 'ASC' } },
      })
      .then(({ status, data: { total, cursor, hasMore, items } }) => {
        expect(status).toEqual('OK');
        expect(total).toBe(5);
        expect(cursor).toBe(4);
        expect(hasMore).toBeTruthy();
        expect(items.map(({ id }) => id)).toEqual(['repo_pag_test_03', 'repo_pag_test_04']);
      }));

  it('should do paginated commit search: cursor=3 pagesize=2', async () =>
    repo
      .fullTextSearchCommit({
        query: '@id:repo_pag_test*',
        cursor: 3,
        pagesize: 2,
        param: { sortBy: { field: 'ts', sort: 'ASC' } },
      })
      .then(({ status, data: { total, cursor, hasMore, items } }) => {
        expect(status).toEqual('OK');
        expect(total).toBe(5);
        expect(cursor).toBe(5);
        expect(hasMore).toBeFalsy();
        expect(items.map(({ id }) => id)).toEqual(['repo_pag_test_04', 'repo_pag_test_05']);
      }));

  it('should do paginated commit search: cursor=4 pagesize=2', async () =>
    repo
      .fullTextSearchCommit({
        query: '@id:repo_pag_test*',
        cursor: 4,
        pagesize: 2,
        param: { sortBy: { field: 'ts', sort: 'ASC' } },
      })
      .then(({ status, data: { total, cursor, hasMore, items } }) => {
        expect(status).toEqual('OK');
        expect(total).toBe(5);
        expect(cursor).toBe(5);
        expect(hasMore).toBeFalsy();
        expect(items.map(({ id }) => id)).toEqual(['repo_pag_test_05']);
      }));

  it('should do paginated commit search: cursor=5 pagesize=2', async () =>
    repo
      .fullTextSearchCommit({
        query: '@id:repo_pag_test*',
        cursor: 5,
        pagesize: 2,
        param: { sortBy: { field: 'ts', sort: 'ASC' } },
      })
      .then(({ status, data: { total, cursor, hasMore, items } }) => {
        expect(status).toEqual('OK');
        expect(total).toBe(5);
        expect(cursor).toBe(null);
        expect(hasMore).toBeFalsy();
        expect(items).toEqual([]);
      }));

  // returns
  // {
  //   total: 5,
  //     items: [
  //   {
  //     createdAt: '1613227831604',
  //     creator: 'repo_tester_5391',
  //     description: '#1 pag-test',
  //     eventInvolved: [Array],
  //     id: 'repo_pag_test_01',
  //     tags: [Array],
  //     timestamp: '1613227831604',
  //     value: 1
  //   },
  //   {
  //     createdAt: '1613227839882',
  //     creator: 'repo_tester_5391',
  //     description: '#2 pag-test',
  //     eventInvolved: [Array],
  //     id: 'repo_pag_test_02',
  //     tags: [Array],
  //     timestamp: '1613227839882',
  //     value: -1
  //   }
  // ],
  //   hasMore: true,
  //   cursor: 2
  // }
  it('should do paginated entity search: cursor=0 pagesize=2', async () =>
    repo
      .fullTextSearchEntity<OutputCounter>({
        entityName,
        query: '@id:repo_pag_test*',
        cursor: 0,
        pagesize: 2,
        param: { sortBy: { field: 'ts', sort: 'ASC' } },
      })
      .then(({ data, status }) => {
        expect(status).toEqual('OK');
        expect(data.total).toEqual(5);
        expect(data.cursor).toEqual(2);
        expect(data.hasMore).toBeTruthy();
        expect(data.items.map(({ id }) => id)).toEqual(['repo_pag_test_01', 'repo_pag_test_02']);
      }));

  it('should do paginated entity search: cursor=1 pagesize=2', async () =>
    repo
      .fullTextSearchEntity<OutputCounter>({
        entityName,
        query: '@id:repo_pag_test*',
        cursor: 1,
        pagesize: 2,
        param: { sortBy: { field: 'ts', sort: 'ASC' } },
      })
      .then(({ data, status }) => {
        expect(status).toEqual('OK');
        expect(data.total).toEqual(5);
        expect(data.cursor).toEqual(3);
        expect(data.hasMore).toBeTruthy();
        expect(data.items.map(({ id }) => id)).toEqual(['repo_pag_test_02', 'repo_pag_test_03']);
      }));

  it('should do paginated entity search: cursor=2 pagesize=2', async () =>
    repo
      .fullTextSearchEntity<OutputCounter>({
        entityName,
        query: '@id:repo_pag_test*',
        cursor: 2,
        pagesize: 2,
        param: { sortBy: { field: 'ts', sort: 'ASC' } },
      })
      .then(({ data, status }) => {
        expect(status).toEqual('OK');
        expect(data.total).toEqual(5);
        expect(data.cursor).toEqual(4);
        expect(data.hasMore).toBeTruthy();
        expect(data.items.map(({ id }) => id)).toEqual(['repo_pag_test_03', 'repo_pag_test_04']);
      }));

  it('should do paginated entity search: cursor=0 pagesize=2', async () =>
    repo
      .fullTextSearchEntity<OutputCounter>({
        entityName,
        query: '@id:repo_pag_test*',
        cursor: 3,
        pagesize: 2,
        param: { sortBy: { field: 'ts', sort: 'ASC' } },
      })
      .then(({ data, status }) => {
        expect(status).toEqual('OK');
        expect(data.total).toEqual(5);
        expect(data.cursor).toEqual(5);
        expect(data.hasMore).toBeFalsy();
        expect(data.items.map(({ id }) => id)).toEqual(['repo_pag_test_04', 'repo_pag_test_05']);
      }));

  it('should do paginated entity search: cursor=0 pagesize=2', async () =>
    repo
      .fullTextSearchEntity<OutputCounter>({
        entityName,
        query: '@id:repo_pag_test*',
        cursor: 4,
        pagesize: 2,
        param: { sortBy: { field: 'ts', sort: 'ASC' } },
      })
      .then(({ data, status }) => {
        expect(status).toEqual('OK');
        expect(data.total).toEqual(5);
        expect(data.cursor).toEqual(5);
        expect(data.hasMore).toBeFalsy();
        expect(data.items.map(({ id }) => id)).toEqual(['repo_pag_test_05']);
      }));

  it('should do paginated entity search: cursor=0 pagesize=2', async () =>
    repo
      .fullTextSearchEntity<OutputCounter>({
        entityName,
        query: '@id:repo_pag_test*',
        cursor: 5,
        pagesize: 2,
        param: { sortBy: { field: 'ts', sort: 'ASC' } },
      })
      .then(({ data, status }) => {
        expect(status).toEqual('OK');
        expect(data.total).toBe(5);
        expect(data.cursor).toBe(null);
        expect(data.hasMore).toBeFalsy();
        expect(data.items).toEqual([]);
      }));
});
