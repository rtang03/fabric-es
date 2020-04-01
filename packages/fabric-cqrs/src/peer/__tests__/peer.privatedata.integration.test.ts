require('../../env');
import { Wallets } from 'fabric-network';
import { pick } from 'lodash';
import { bootstrapNetwork } from '../../account';
import { Counter, CounterEvent, reducer } from '../../example';
import { Commit, Peer, PrivatedataRepository } from '../../types';
import { createProjectionDb } from '../createProjectionDb';
import { createQueryDatabase } from '../createQueryDatabase';
import { createPeer } from '../peer';

let peer: Peer;
let repo: PrivatedataRepository;
const entityName = 'privatedata_counter';
const enrollmentId = `peer_privatedata${Math.floor(Math.random() * 1000)}`;
let commitId: string;

beforeAll(async () => {
  let context;

  try {
    context = await bootstrapNetwork({
      caAdmin: process.env.CA_ENROLLMENT_ID_ADMIN,
      caAdminPW: process.env.CA_ENROLLMENT_SECRET_ADMIN,
      channelEventHub: process.env.CHANNEL_HUB,
      channelName: process.env.CHANNEL_NAME,
      connectionProfile: process.env.CONNECTION_PROFILE,
      fabricNetwork: process.env.NETWORK_LOCATION,
      wallet: await Wallets.newFileSystemWallet(process.env.WALLET),
      enrollmentId,
      enrollmentSecret: 'password'
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

  repo = peer.getPrivateDataRepo<Counter, CounterEvent>({
    entityName,
    reducer
  });
});

afterAll(async () => peer.disconnect());

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
    repo.getByEntityName().then(({ data }) => expect(data).toEqual([{ value: 1 }])));

  it('should getById', async () =>
    repo
      .getById({ enrollmentId, id: enrollmentId })
      .then(({ currentState }) => expect(currentState).toEqual({ value: 1 })));

  it('should deleteByEntityIdCommitId', async () =>
    repo.deleteByEntityIdCommitId(enrollmentId, commitId).then(({ status }) => expect(status).toBe('SUCCESS')));
});
