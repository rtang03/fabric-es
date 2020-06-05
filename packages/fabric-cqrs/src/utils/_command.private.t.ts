// require('dotenv').config({ path: './.env.dev' });
// import { enrollAdmin } from '@fabric-es/operator';
// import { Wallet, Wallets } from 'fabric-network';
// import pick from 'lodash/pick';
// import values from 'lodash/values';
// import { Store } from 'redux';
// import rimraf from 'rimraf';
// import { registerUser } from '../../../account';
// import type { Commit } from '../../../types';
// import { getLogger } from '../../../utils';
// import { getNetwork } from '../../../utils/services';
// import { generateToken } from '../../utils';
// import { action } from '../action';
// import { getStore } from './__utils__/store';
//
// let context: any;
// let commitId: string;
// let store: Store;
// const connectionProfile = process.env.CONNECTION_PROFILE;
// const channelName = process.env.CHANNEL_NAME;
// const fabricNetwork = process.env.NETWORK_LOCATION;
// const mspId = process.env.MSPID;
// const entityName = 'store_privatedata';
// const enrollmentId = `store_privatedata${Math.floor(Math.random() * 1000)}`;
// const logger = getLogger({ name: 'command.privatedata.integration.ts' });
//
// let wallet: Wallet;
//
// beforeAll(async () => {
//   try {
//     rimraf.sync(`${process.env.WALLET}/${process.env.ORG_ADMIN_ID}.id`);
//     rimraf.sync(`${process.env.WALLET}/${process.env.CA_ENROLLMENT_ID_ADMIN}.id`);
//
//     wallet = await Wallets.newFileSystemWallet(process.env.WALLET);
//
//     await enrollAdmin({
//       caUrl: process.env.ORG_CA_URL,
//       connectionProfile,
//       enrollmentID: process.env.ORG_ADMIN_ID,
//       enrollmentSecret: process.env.ORG_ADMIN_SECRET,
//       fabricNetwork,
//       mspId,
//       wallet,
//     });
//
//     await enrollAdmin({
//       caUrl: process.env.ORG_CA_URL,
//       connectionProfile,
//       enrollmentID: process.env.CA_ENROLLMENT_ID_ADMIN,
//       enrollmentSecret: process.env.CA_ENROLLMENT_SECRET_ADMIN,
//       fabricNetwork,
//       mspId,
//       wallet,
//     });
//
//     await registerUser({
//       caAdmin: process.env.CA_ENROLLMENT_ID_ADMIN,
//       caAdminPW: process.env.CA_ENROLLMENT_SECRET_ADMIN,
//       fabricNetwork,
//       enrollmentId,
//       enrollmentSecret: 'password',
//       connectionProfile,
//       wallet,
//       mspId,
//     });
//
//     context = await getNetwork({
//       channelName,
//       connectionProfile,
//       wallet,
//       enrollmentId,
//       discovery: false,
//       asLocalhost: true,
//     });
//
//     context.logger = logger;
//
//     store = getStore(context);
//   } catch (err) {
//     console.error(err);
//     process.exit(1);
//   }
// });
//
// afterAll(async () => {
//   rimraf.sync(`${process.env.WALLET}/${enrollmentId}.id`);
//   context.gateway.disconnect();
// });
//
// describe('Store:privatedata Tests', () => {
//   it('should createCommit', (done) => {
//     const tid = generateToken();
//     const unsubscribe = store.subscribe(() => {
//       const { tx_id, result, type } = store.getState().write;
//       if (tx_id === tid && type === action.CREATE_SUCCESS) {
//         const commit = values(result)[0];
//         commitId = commit.commitId;
//         expect(pick(commit, 'entityName', 'version', 'events')).toMatchSnapshot();
//         unsubscribe();
//         done();
//       }
//     });
//     store.dispatch(
//       action.create({
//         tx_id: tid,
//         args: {
//           entityName,
//           id: enrollmentId,
//           version: 0,
//           events: [{ type: 'User Created', payload: { name: 'me' } }],
//           isPrivateData: true,
//         },
//         // Special attention: createAction will be based on newly created account (given below
//         // enrollmentId; to using a new Fabric contract, to submit transaction, and based on its x509
//         // cert. Other actions does not require to supply enrollmentId, and will keep using admin ecert
//         enrollmentId,
//         connectionProfile,
//         channelName,
//         wallet,
//       })
//     );
//   });
//
//   it('should queryByEntityIdCommitId', (done) => {
//     const tid = generateToken();
//     const unsubscribe = store.subscribe(() => {
//       const { tx_id, result, type } = store.getState().write;
//       if (tx_id === tid && type === action.QUERY_SUCCESS) {
//         expect(pick(values(result)[0], ['entityName', 'version', 'events'])).toMatchSnapshot();
//         unsubscribe();
//         done();
//       }
//     });
//     store.dispatch(
//       action.queryByEntIdCommitId({
//         tx_id: tid,
//         args: { entityName, commitId, id: enrollmentId, isPrivateData: true },
//         connectionProfile,
//         channelName,
//         wallet,
//       })
//     );
//   });
//
//   it('should queryByEntityName', (done) => {
//     const tid = generateToken();
//     const unsubscribe = store.subscribe(() => {
//       const { tx_id, result, type } = store.getState().write;
//       if (tx_id === tid && type === action.QUERY_SUCCESS) {
//         values<Commit>(result)
//           .map((commit) => pick(commit, 'entityName', 'version', 'events'))
//           .map((commit) => expect(commit).toMatchSnapshot());
//         unsubscribe();
//         done();
//       }
//     });
//     store.dispatch(
//       action.queryByEntityName({
//         tx_id: tid,
//         args: { entityName, isPrivateData: true },
//         connectionProfile,
//         channelName,
//         wallet,
//       })
//     );
//   });
//
//   it('should queryByEntityId', (done) => {
//     const tid = generateToken();
//     const unsubscribe = store.subscribe(() => {
//       const { tx_id, result, type } = store.getState().write;
//       if (tx_id === tid && type === action.QUERY_SUCCESS) {
//         values<Commit>(result)
//           .map((commit) => pick(commit, 'entityName', 'version', 'events'))
//           .map((commit) => expect(commit).toMatchSnapshot());
//         unsubscribe();
//         done();
//       }
//     });
//     store.dispatch(
//       action.queryByEntityId({
//         tx_id: tid,
//         args: { entityName, id: enrollmentId, isPrivateData: true },
//         connectionProfile,
//         channelName,
//         wallet,
//       })
//     );
//   });
//
//   it('should deleteByEntityIdCommitId', (done) => {
//     const tid = generateToken();
//     const unsubscribe = store.subscribe(() => {
//       const { tx_id, result, type } = store.getState().write;
//       if (tx_id === tid && type === action.DELETE_SUCCESS) {
//         expect(result.status).toBe('SUCCESS');
//         unsubscribe();
//         done();
//       }
//     });
//     store.dispatch(
//       action.deleteByEntityIdCommitId({
//         tx_id: tid,
//         args: { entityName, id: enrollmentId, commitId, isPrivateData: true },
//         connectionProfile,
//         channelName,
//         wallet,
//       })
//     );
//   });
// });
