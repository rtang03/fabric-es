require('../../env');
import { Wallets } from 'fabric-network';
import { find, pick } from 'lodash';
import { bootstrapNetwork } from '../../account';
import { Counter, CounterEvent, reducer } from '../../example';
import { Peer, Repository } from '../../types';
import { createProjectionDb } from '../createProjectionDb';
import { createQueryDatabase } from '../createQueryDatabase';
import { createPeer } from '../peer';

let peer: Peer;
let repo: Repository<Counter, CounterEvent>;
const entityName = 'counter';
const enrollmentId = `peer_test${Math.floor(Math.random() * 10000)}`;

beforeAll(async () => {
  let context;

  try {
    context = await bootstrapNetwork({
      caAdmin: process.env.CA_ENROLLMENT_ID_ADMIN,
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

  try {
    peer.subscribeHub();
  } catch (err) {
    console.error('Subscribe hub error');
    console.error(err);
    process.exit(1);
  }

  repo = peer.getRepository<Counter, CounterEvent>({ entityName, reducer });
});

afterAll(async () => {
  peer.unsubscribeHub();
  peer.disconnect();
});

describe('Start peer Tests', () => {
  beforeAll(async () => {
    await repo
      .deleteByEntityId(enrollmentId)
      .then(() => true)
      .catch(() => true);
    await repo
      .deleteByEntityName_query()
      .then(({ status }) => status)
      .then(res => expect(res).toEqual('all records deleted successfully'));
  });

  it('should ADD #1', async () => {
    await repo
      .create({ enrollmentId, id: enrollmentId })
      .save([{ type: 'ADD' }])
      .then(result => pick(result, 'version', 'entityName', 'events'))
      .then(result => expect(result).toMatchSnapshot());

    const timer = new Promise(done => {
      setTimeout(() => done(), 3000);
    });

    await timer;

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
});

describe('Query', () => {
  it('should Query', done => {
    setTimeout(async () => {
      // await repo
      //   .getByEntityName()
      //   .then(result => expect(result).toEqual({ data: [{ value: 1 }] }));

      await repo
        .getById({ enrollmentId, id: enrollmentId })
        .then(({ currentState }) => currentState)
        .then(result => expect(result).toEqual({ value: 2 }));

      await repo
        .getCommitById(enrollmentId)
        .then(({ data }) => data)
        .then(result => expect(result.length).toEqual(2));

      await repo
        .getProjection({ all: true })
        .then(({ data }) => data)
        .then(result => find(result, { id: enrollmentId }))
        .then(result => expect(result).toEqual({ id: enrollmentId, value: 2 }));

      await repo
        .getProjection({ where: { id: enrollmentId } })
        .then(({ data }) => data)
        .then(result => find(result, { id: enrollmentId }))
        .then(result => expect(result).toEqual({ id: enrollmentId, value: 2 }));

      await repo
        .getProjection({ contain: 'peer_test' })
        .then(({ data }) => data)
        .then(results => results.forEach(({ id }) => expect(id.startsWith('peer_test')).toBe(true)));
      done();
    }, 6000);
  });
});
