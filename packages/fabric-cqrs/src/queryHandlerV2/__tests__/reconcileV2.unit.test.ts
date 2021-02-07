import { getNetwork } from '../../services';

require('dotenv').config({ path: './.env.dev' });
import { enrollAdmin } from '@fabric-es/operator';
import { Wallets } from 'fabric-network';
import { Redisearch } from 'redis-modules-sdk';
import rimraf from 'rimraf';
import { createQueryHandlerV2, createQueryDatabaseV2, createRedisRepository } from '..';
import {
  Counter,
  CounterInRedis,
  counterSearchDefinition as fields,
  OutputCounter,
  postSelector,
  preSelector,
  reducer,
} from '../../unit-test-reducer';
import { waitForSecond } from '../../utils';
import type { OutputCommit, QueryHandlerV2, RedisRepository } from '../types';

const caAdmin = process.env.CA_ENROLLMENT_ID_ADMIN;
const caAdminPW = process.env.CA_ENROLLMENT_SECRET_ADMIN;
const caName = process.env.CA_NAME;
const channelName = process.env.CHANNEL_NAME;
const ENTITYID = 'qh_proj_test_001';
const entityName = 'test_reconcile';
const connectionProfile = process.env.CONNECTION_PROFILE;
const id = `qh_test_001`;
const id2 = `qh_test_002`;
const mspId = process.env.MSPID;
const orgAdminId = process.env.ORG_ADMIN_ID;
const orgAdminSecret = process.env.ORG_ADMIN_SECRET;
const reducers = { [entityName]: reducer };
const walletPath = process.env.WALLET;

let client: Redisearch;
let queryHandler: QueryHandlerV2;
let counterRedisRepo: RedisRepository<OutputCounter>;
let commitRepo: RedisRepository<OutputCommit>;

/**
 * ./dn-run.1-db-red-auth.sh
 */
beforeAll(async () => {
  rimraf.sync(`${walletPath}/${orgAdminId}.id`);
  rimraf.sync(`${walletPath}/${caAdmin}.id`);

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

    // Step 2: EnrollCaAdmin
    await enrollAdmin({
      enrollmentID: caAdmin,
      enrollmentSecret: caAdminPW,
      connectionProfile,
      caName,
      mspId,
      wallet,
    });

    // Step 3: connect Redis
    client = new Redisearch({ host: 'localhost', port: 6379 });
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
    const queryDatabase = createQueryDatabaseV2(client, { [entityName]: counterRedisRepo });
    commitRepo = queryDatabase.getRedisCommitRepo();

    // Step 6: obtain network configuration of Hyperledger Fabric
    const { gateway, network } = await getNetwork({
      discovery: true,
      asLocalhost: true,
      channelName,
      connectionProfile,
      wallet,
      enrollmentId: orgAdminId,
    });

    queryHandler = createQueryHandlerV2({
      entityNames: [entityName],
      gateway,
      network,
      queryDatabase,
      connectionProfile,
      channelName,
      wallet,
      reducers,
    });

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

    const { status } = await queryDatabase.clearNotifications({ creator: 'org1-admin' });
    console.log(`clearNotifications: ${status}`);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
});

afterAll(async () => {
  await client.disconnect();
  return waitForSecond(5);
});

describe('Reconcile Tests', () => {
  it('should', async () => queryHandler);
});
