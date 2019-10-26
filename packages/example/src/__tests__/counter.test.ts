import {
  bootstrapNetwork,
  createPeer,
  Peer,
  Repository
} from '@espresso/fabric-cqrs';
import { Gateway, Network } from 'fabric-network';
import '../env';
import { Counter, CounterEvent, reducer } from '../reducer';

let network: Network;
let gateway: Gateway;
let peer: Peer;
let repo: Repository<Counter, CounterEvent>;
const entityName = 'ex_counter';
const enrollmentId = `counter_ex_test${Math.floor(Math.random() * 10000)}`;

beforeAll(async () => {
  const context = await bootstrapNetwork({ enrollmentId });
  network = context.network;
  gateway = context.gateway;
  peer = createPeer({ ...context, reducer, collection: 'Org1PrivateDetails' });
  await peer.subscribeHub();
  repo = peer.getRepository<Counter, CounterEvent>({ entityName, reducer });
});

afterAll(async () => {
  peer.unsubscribeHub();
  gateway.disconnect();
});

describe('Example Test', async () => {
  it('should Add', async () => {});
});
