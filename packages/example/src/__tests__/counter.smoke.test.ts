import {
  bootstrapNetwork,
  createPeer,
  Peer,
  Repository
} from '@espresso/fabric-cqrs';
import { Gateway, Network } from 'fabric-network';
import { pick } from 'lodash';
import '../env';
import { Counter, CounterEvent, reducer } from '../reducer';

let network: Network;
let gateway: Gateway;
let peer: Peer;
let repo: Repository<Counter, CounterEvent>;
const entityName = 'ex_counter';
const enrollmentId = `counter_ex_test${Math.floor(Math.random() * 10000)}`;

beforeAll(async () => {
  const context = await bootstrapNetwork({
    enrollmentId
  });
  network = context.network;
  gateway = context.gateway;
  peer = createPeer({
    ...context,
    defaultEntityName: entityName,
    defaultReducer: reducer,
    collection: 'Org1PrivateDetails'
  });
  await peer.subscribeHub();
  repo = peer.getRepository<Counter, CounterEvent>({ entityName, reducer });
});

afterAll(async () => {
  peer.unsubscribeHub();
  gateway.disconnect();
});

/**
 * This is smoke test only, to validate gateway connection
 */
describe('Example Smoke Test', () => {
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

  it('should Add', async () =>
    repo
      .create({ enrollmentId, id: enrollmentId })
      .save([{ type: 'ADD' }])
      .then(result => pick(result, 'version', 'entityName', 'events'))
      .then(result => expect(result).toMatchSnapshot()));
});
