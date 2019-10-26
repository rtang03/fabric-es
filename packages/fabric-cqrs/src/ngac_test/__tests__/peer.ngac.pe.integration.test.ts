// import { Counter, CounterEvent, reducer } from '../../example';
// import { createPeer } from '../../peer';
// import { projectionDb, queryDatabase } from '../../peer/__tests__/__utils__';
// import { getNetwork } from '../../services';
// import { Peer, Repository } from '../../types';
// import { registerUserOrg2 } from '../registerUserOrg2';
//
// let peer: Peer;
// let repo: Repository<Counter, CounterEvent>;
// const entityName = 'counter';
// const identity = `ngac_test${Math.floor(Math.random() * 1000)}`;
//
// beforeAll(async () => {
//   try {
//     await registerUserOrg2({
//       enrollmentID: identity,
//       enrollmentSecret: 'password'
//     });
//     const context = await getNetwork({ identity });
//     peer = createPeer({
//       ...context,
//       reducer,
//       queryDatabase,
//       projectionDb,
//       collection: 'Org1PrivateDetails'
//     });
//     await peer.subscribeHub();
//     repo = peer.getRepository<Counter, CounterEvent>({ entityName, reducer });
//   } catch (error) {
//     console.error(error);
//     process.exit(-1);
//   }
// });
//
// afterAll(async () => {
//   peer.unsubscribeHub();
//   peer.disconnect();
// });
//
// describe('Ngac Consolidated Tests', () => {
//   it('should', async () => {});
// });
