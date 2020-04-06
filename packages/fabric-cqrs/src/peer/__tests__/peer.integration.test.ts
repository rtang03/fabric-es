require('../../env');
import util from 'util';
import { enrollAdmin } from '@fabric-es/operator';
import { Wallet, Wallets } from 'fabric-network';
import { find, pick } from 'lodash';
import rimraf from 'rimraf';
import { registerUser } from '../../account';
import { Counter, CounterEvent, reducer } from '../../example';
import { getNetwork } from '../../services';
import { Peer, Repository } from '../../types';
import { createProjectionDb } from '../createProjectionDb';
import { createQueryDatabase } from '../createQueryDatabase';
import { createPeer } from '../peer';
import { waitFor } from '../utils';

let wallet: Wallet;
let peer: Peer;
let context;
let repo: Repository<Counter, CounterEvent>;
const entityName = 'counter';
const enrollmentId = `peer_test${Math.floor(Math.random() * 10000)}`;
const connectionProfile = process.env.CONNECTION_PROFILE;
const channelName = process.env.CHANNEL_NAME;
const fabricNetwork = process.env.NETWORK_LOCATION;
const mspId = process.env.MSPID;
const caUrl = process.env.ORG_CA_URL;

beforeAll(async () => {
  try {
    rimraf.sync(`${process.env.WALLET}/${process.env.ORG_ADMIN_ID}.id`);
    rimraf.sync(`${process.env.WALLET}/${process.env.CA_ENROLLMENT_ID_ADMIN}.id`);

    wallet = await Wallets.newFileSystemWallet(process.env.WALLET);

    await enrollAdmin({
      caUrl,
      connectionProfile,
      enrollmentID: process.env.ORG_ADMIN_ID,
      enrollmentSecret: process.env.ORG_ADMIN_SECRET,
      fabricNetwork,
      mspId,
      wallet
    });

    await enrollAdmin({
      caUrl,
      connectionProfile,
      enrollmentID: process.env.CA_ENROLLMENT_ID_ADMIN,
      enrollmentSecret: process.env.CA_ENROLLMENT_SECRET_ADMIN,
      fabricNetwork,
      mspId,
      wallet
    });

    await registerUser({
      caAdmin: process.env.CA_ENROLLMENT_ID_ADMIN,
      caAdminPW: process.env.CA_ENROLLMENT_SECRET_ADMIN,
      fabricNetwork,
      enrollmentId,
      enrollmentSecret: 'password',
      connectionProfile,
      wallet,
      mspId
    });

    context = await getNetwork({
      channelName,
      connectionProfile,
      wallet,
      enrollmentId,
      discovery: true
    });
  } catch (err) {
    console.error('Bootstrap network error');
    console.error(err);
    process.exit(1);
  }

  peer = createPeer({
    ...context,
    defaultReducer: reducer,
    defaultEntityName: entityName,
    queryDatabase: createQueryDatabase(),
    projectionDb: createProjectionDb(entityName),
    collection: process.env.COLLECTION,
    channelEventHubUri: process.env.CHANNEL_HUB,
    channelName: process.env.CHANNEL_NAME,
    connectionProfile: process.env.CONNECTION_PROFILE,
    wallet: await Wallets.newFileSystemWallet(process.env.WALLET)
  });

  try {
    peer.subscribeHub();
  } catch (e) {
    console.error(util.format('Subscribe hub error, %j', e));
    process.exit(1);
  }

  repo = peer.getRepository<Counter, CounterEvent>({ entityName, reducer });
});

afterAll(async () => {
  rimraf.sync(`${process.env.WALLET}/${enrollmentId}.id`);
  peer.unsubscribeHub();
  peer.disconnect();
});

describe('Start peer Tests', () => {
  beforeAll(async () => {
    await repo
      .deleteByEntityId(enrollmentId)
      .then(() => true)
      .catch(() => true);

    await waitFor(1);

    await repo
      .deleteByEntityName_query()
      .then(({ status }) => status)
      .then(res => expect(res).toEqual('all records deleted successfully'));

    await waitFor(1);
  });

  it('should ADD #1', async () => {
    await repo
      .create({ enrollmentId, id: enrollmentId })
      .save([{ type: 'ADD' }])
      .then(result => pick(result, 'version', 'entityName', 'events'))
      .then(result => expect(result).toMatchSnapshot());

    await waitFor(3);

    await repo
      .getById({ enrollmentId, id: enrollmentId })
      .then(({ save }) => save([{ type: 'ADD' }]))
      .then(result => pick(result, 'version', 'entityName', 'events'))
      .then(result =>
        expect(result).toEqual({
          version: 1,
          entityName: 'counter'
        })
      );
  });

  it('should Query = getById', async () => {
    await waitFor(1);
    await repo
      .getById({ enrollmentId, id: enrollmentId })
      .then(({ currentState }) => currentState)
      .then(result => expect(result).toEqual({ value: 2 }));
  });

  it('should Query = getCommitById', async () => {
    await waitFor(1);
    await repo
      .getCommitById(enrollmentId)
      .then(({ data }) => data)
      .then(result => expect(result.length).toEqual(2));
  });

  it('should Query = getProjection/all', async () => {
    await waitFor(1);
    await repo
      .getProjection({ all: true })
      .then(({ data }) => data)
      .then(result => find(result, { id: enrollmentId }))
      .then(result => expect(result).toEqual({ id: enrollmentId, value: 2 }));
  });

  it('should Query = getProjection/where', async () => {
    await waitFor(1);
    await repo
      .getProjection({ where: { id: enrollmentId } })
      .then(({ data }) => data)
      .then(result => find(result, { id: enrollmentId }))
      .then(result => expect(result).toEqual({ id: enrollmentId, value: 2 }));
  });

  it('should Query = getProjection/contain', async () => {
    await waitFor(1);
    await repo
      .getProjection({ contain: 'peer_test' })
      .then(({ data }) => data)
      .then(results => results.forEach(({ id }) => expect(id.startsWith('peer_test')).toBe(true)));
  });
});
