require('../../env');
import { enrollAdmin } from '@fabric-es/operator';
import { Wallet, Wallets } from 'fabric-network';
import { pick } from 'lodash';
import rimraf from 'rimraf';
import { registerUser } from '../../account';
import { Counter, CounterEvent, reducer } from '../../store/example';
import { getNetwork } from '../../services';
import { Commit, Peer, PrivatedataRepository } from '../../types';
import { createProjectionDb } from '../createProjectionDb';
import { createQueryDatabase } from '../createQueryDatabase';
import { createPeer } from '../peer';

let peer: Peer;
let context;
let commitId: string;
let repo: PrivatedataRepository;
let wallet: Wallet;
const connectionProfile = process.env.CONNECTION_PROFILE;
const channelName = process.env.CHANNEL_NAME;
const fabricNetwork = process.env.NETWORK_LOCATION;
const mspId = process.env.MSPID;
const entityName = 'privatedata_counter';
const enrollmentId = `peer_privatedata${Math.floor(Math.random() * 1000)}`;

beforeAll(async () => {
  try {
    rimraf.sync(`${process.env.WALLET}/${process.env.ORG_ADMIN_ID}.id`);
    rimraf.sync(`${process.env.WALLET}/${process.env.CA_ENROLLMENT_ID_ADMIN}.id`);

    wallet = await Wallets.newFileSystemWallet(process.env.WALLET);

    await enrollAdmin({
      caUrl: process.env.ORG_CA_URL,
      connectionProfile,
      enrollmentID: process.env.ORG_ADMIN_ID,
      enrollmentSecret: process.env.ORG_ADMIN_SECRET,
      fabricNetwork,
      mspId,
      wallet
    });

    await enrollAdmin({
      caUrl: process.env.ORG_CA_URL,
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
      discovery: false,
      asLocalhost: true
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
    channelEventHubUri: process.env.CHANNEL_HUB,
    channelName: process.env.CHANNEL_NAME,
    connectionProfile: process.env.CONNECTION_PROFILE,
    wallet: await Wallets.newFileSystemWallet(process.env.WALLET)
  });

  repo = peer.getPrivateDataRepo<Counter, CounterEvent>({
    entityName,
    reducer
  });
});

afterAll(async () => {
  rimraf.sync(`${process.env.WALLET}/${enrollmentId}.id`);
  peer.disconnect();
});

describe('Start peer privatedata Tests', () => {
  it('should Add #1', async () =>
    repo
      .create({ enrollmentId, id: enrollmentId })
      .save([{ type: 'ADD' }])
      .then((commit: Commit) => {
        commitId = commit.commitId;
        expect(pick(commit, 'version', 'entityName')).toMatchSnapshot();
      }));

  it('should getByEntityName', async () =>
    // repo.getByEntityName().then(({ data }) => expect(data).toEqual([{ value: 1 }])));
    repo.getByEntityName().then(({ data }) => data.forEach(item => expect(item).toEqual({ value: 1 }))));

  it('should getById', async () =>
    repo
      .getById({ enrollmentId, id: enrollmentId })
      .then(({ currentState }) => expect(currentState).toEqual({ value: 1 })));

  it('should deleteByEntityIdCommitId', async () =>
    repo
      .deleteByEntityIdCommitId(enrollmentId, commitId)
      .catch(response => expect(response?.error !== undefined).toBeTruthy()));
});
