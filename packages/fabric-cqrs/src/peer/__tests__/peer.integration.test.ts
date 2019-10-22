import { find, pick } from 'lodash';
import { bootstrap } from '../../account/registerUser';
import { Counter, CounterEvent, reducer } from '../../example';
import { Peer, Repository } from '../../types';
import { createPeer } from '../peer';
import { projectionDb, queryDatabase } from './__utils__';

let peer: Peer;
let repo: Repository<Counter, CounterEvent>;
const entityName = 'counter';
const identity = `peer_test${Math.floor(Math.random() * 1000)}`;

beforeAll(async () => {
  const context = await bootstrap(identity);
  peer = createPeer({
    ...context,
    reducer,
    queryDatabase,
    projectionDb,
    collection: 'Org1PrivateDetails'
  });
  await peer.subscribeHub();
  repo = peer.getRepository<Counter, CounterEvent>({ entityName, reducer });
});

afterAll(async () => {
  peer.unsubscribeHub();
  peer.disconnect();
});

describe('Start peer Tests', () => {
  it('Setup test - 1', async () =>
    await repo
      .deleteByEntityId(identity)
      .then(() => true)
      .catch(() => true));

  it('Setup test - 2', async () =>
    await repo
      .deleteByEntityName_query()
      .then(({ status }) => status)
      .then(res => expect(res).toEqual('all records deleted successfully')));

  it('should ADD #1', async () => {
    await repo
      .create(identity)
      .save([{ type: 'ADD' }])
      .then(result => pick(result, 'version', 'entityName', 'events'))
      .then(result => expect(result).toMatchSnapshot());

    await repo
      .getById(identity)
      .then(({ save }) => save([{ type: 'ADD' }]))
      .then(result => pick(result, 'version', 'entityName', 'events'))
      .then(result =>
        expect(result).toEqual({
          version: 1,
          entityName: 'counter',
          events: [{ type: 'ADD' }]
        })
      );
  });
});

describe('Query', () => {
  it('should Query', done => {
    setTimeout(async () => {
      await repo
        .getByEntityName()
        .then(result => expect(result).toEqual({ data: [{ value: 2 }] }));

      await repo
        .getById(identity)
        .then(({ currentState }) => currentState)
        .then(result => expect(result).toEqual({ value: 2 }));

      await repo
        .getCommitById(identity)
        .then(({ data }) => data)
        .then(result => expect(result.length).toEqual(2));

      await repo
        .getProjection({ all: true })
        .then(({ data }) => data)
        .then(result => find(result, { id: identity }))
        .then(result => expect(result).toEqual({ id: identity, value: 2 }));

      await repo
        .getProjection({ where: { id: identity } })
        .then(({ data }) => data)
        .then(result => find(result, { id: identity }))
        .then(result => expect(result).toEqual({ id: identity, value: 2 }));

      await repo
        .getProjection({ contain: 'peer_test' })
        .then(({ data }) => data)
        .then(results =>
          results.forEach(({ id }) =>
            expect(id.startsWith('peer_test')).toBe(true)
          )
        );

      done();
    }, 10000);
  });
});
