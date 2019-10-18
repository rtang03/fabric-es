import { find, pick } from 'lodash';
import { registerUser } from '../../account/registerUser';
import { Counter, CounterEvent, reducer } from '../../example';
import { getNetwork } from '../../services';
import { Repository } from '../../types';
import { Peer } from '../peer';
import { projectionDb, queryDatabase } from './__utils__';

let peer: Peer;
let repo: Repository<Counter, CounterEvent>;
const entityName = 'counter';
const identity = `peer_test${Math.floor(Math.random() * 1000)}`;

beforeAll(async () => {
  try {
    await registerUser({
      enrollmentID: identity,
      enrollmentSecret: 'password'
    });
    const context = await getNetwork({ identity });
    peer = new Peer({
      ...context,
      reducer,
      queryDatabase,
      projectionDb,
      collection: 'Org1PrivateDetails'
    });
    await peer.subscribeHub();
    repo = peer.getRepository<Counter, CounterEvent>({ entityName, reducer });
  } catch (error) {
    console.error(error);
    process.exit(-1);
  }
});

afterAll(async () => {
  peer.unsubscribeHub();
  peer.disconnect();
});

it('Setup test - 1', async () =>
  repo
    .deleteByEntityId(identity)
    .then(() => true)
    .catch(() => true));

it('Setup test - 2', async () =>
  repo
    .deleteByEntityName_query()
    .then(({ status }) => status)
    .then(res => expect(res).toEqual('all records deleted successfully')));

describe('Start peer Tests', () => {
  describe('ADD', () => {
    it('should ADD #1', async () =>
      repo
        .create(identity)
        .save([{ type: 'ADD' }])
        .then(result => pick(result, 'version', 'entityName', 'events'))
        .then(result => expect(result).toMatchSnapshot()));

    it('should ADD #2', async () =>
      repo
        .create(identity)
        .save([{ type: 'ADD' }])
        .then(result => pick(result, 'version', 'entityName', 'events'))
        .then(result => expect(result).toMatchSnapshot()));
  });

  it('should Query', done => {
    setTimeout(async () => {
      await repo
        .getByEntityName()
        .then(result => expect(result).toEqual({ entities: [{ value: 2 }] }));

      await repo
        .getById(identity)
        .then(({ currentState }) => currentState)
        .then(result => expect(result).toEqual({ value: 2 }));

      await repo
        .getCommitById(identity)
        .then(({ commits }) => commits)
        .then(result => expect(result.length).toEqual(2));

      await repo
        .getProjection({ all: true })
        .then(({ projections }) => projections)
        .then(result => find(result, { id: identity }))
        .then(result => expect(result).toEqual({ id: identity, value: 2 }));

      await repo
        .getProjection({ where: { id: identity } })
        .then(({ projections }) => projections)
        .then(result => find(result, { id: identity }))
        .then(result => expect(result).toEqual({ id: identity, value: 2 }));

      await repo
        .getProjection({ contain: 'peer_test' })
        .then(({ projections }) => projections)
        .then(results =>
          results.forEach(({ id }) =>
            expect(id.startsWith('peer_test')).toBe(true)
          )
        );

      done();
    }, 10000);
  });
});
