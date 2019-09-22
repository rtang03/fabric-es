import { find, pick } from 'lodash';
import { Counter, CounterEvent, reducer } from '../../example';
import { getNetwork } from '../../services';
import { Repository } from '../../types';
import { Peer } from '../peer';
import { projectionDb, queryDatabase } from './__utils__';

let peer: Peer;
let repo: Repository<Counter, CounterEvent>;
const entityName = 'counter';
const id = 'unit_test_01';

beforeAll(async () => {
  const networkConfig = await getNetwork();
  peer = new Peer({
    ...networkConfig,
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

it('Setup test - 1', async () =>
  await repo
    .deleteByEntityId(id)
    .then(() => true)
    .catch(() => true));

it('Setup test - 2', async () =>
  await repo
    .deleteByEntityName_query()
    .then(({ status }) => status)
    .then(res => expect(res).toEqual('all records deleted successfully')));

describe('Start peer Tests', () => {
  describe('ADD', () => {
    it('should ADD #1', async () =>
      await repo
        .create(id)
        .save([{ type: 'ADD' }])
        .then(result => pick(result, 'id', 'version', 'entityName', 'events'))
        .then(result => expect(result).toMatchSnapshot()));

    it('should ADD #2', async () =>
      await repo
        .create(id)
        .save([{ type: 'ADD' }])
        .then(result => pick(result, 'id', 'version', 'entityName', 'events'))
        .then(result => expect(result).toMatchSnapshot()));
  });

  it('should Query', done => {
    setTimeout(async () => {
      await repo
        .getByEntityName()
        .then(result => expect(result).toEqual({ entities: [{ value: 2 }] }));
      await repo
        .getById(id)
        .then(({ currentState }) => currentState)
        .then(result => expect(result).toEqual({ value: 2 }));
      await repo
        .getCommitById(id)
        .then(({ commits }) => commits)
        .then(result => expect(result.length).toEqual(2));
      await repo
        .getProjection({ all: true })
        .then(({ projections }) => projections)
        .then(result => find(result, { id }))
        .then(result => expect(result).toEqual({ id, value: 2 }));
      await repo
        .getProjection({ where: { id } })
        .then(({ projections }) => projections)
        .then(result => find(result, { id }))
        .then(result => expect(result).toEqual({ id, value: 2 }));
      await repo
        .getProjection({ contain: 'unit_test' })
        .then(({ projections }) => projections)
        .then(result => expect(result).toEqual([{ id, value: 2 }]));
      done();
    }, 10000);
  });
});
