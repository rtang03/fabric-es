// import * as Client from 'fabric-client';
// import {
//   newCryptoKeyStore,
//   newCryptoSuite,
//   newDefaultKeyValueStore
// } from 'fabric-client';
// import { readFileSync } from 'fs';
// import { join } from 'path';
// import '../env';
// import { Context } from './types';
// import { clientUtils } from './utils';
//
// export const createChannel: (
//   channelName: string,
//   org: string,
//   context?: Context
// ) => Promise<{ status: any }> = async (
//   channelName,
//   org,
//   context = {
//     kvStorePath: process.env.PATH_TO_CERTS,
//     networkId: process.env.NETWORK_ID || 'trade-network',
//     pathToChannelTx: process.env.PATH_TO_CHANNEL_CONFIG,
//     pathToNetwork: process.env.PATH_TO_NETWORK,
//     pathToNetworkConfig: process.env.PATH_TO_NETWORK_CONFIG
//   }
// ) => {
//   const { kvStorePath, pathToChannelTx, pathToNetworkConfig } = context;
//   const path = kvStorePath + `_${org}`;
//   const { client, config, signatures } = await newDefaultKeyValueStore({ path })
//     .then(store => {
//       Client.addConfigFile(join(__dirname, pathToNetworkConfig));
//       Client.setConfigSetting(
//         'key-value-store',
//         'fabric-client/lib/impl/FileKeyValueStore.js'
//       );
//       const cryptoSuite = newCryptoSuite();
//       cryptoSuite.setCryptoKeyStore(newCryptoKeyStore({ path }));
//       const client = new Client();
//       client.setStateStore(store);
//       client.setCryptoSuite(cryptoSuite);
//       console.log('Successfully extracted the config from the configtx');
//       return client;
//     })
//     .then(async client => {
//       const signatures = [];
//       const envelope = readFileSync(
//         join(__dirname, pathToChannelTx, `${channelName}.tx`)
//       );
//       const config = client.extractChannelConfig(envelope);
//       for (const org of clientUtils(client, context).peerOrgs)
//         signatures.push(
//           // Enrol admin AND Sign Channel Config
//           await clientUtils(client, context)
//             .enrolAdmin(org)
//             .then(() => client.signChannelConfig(config))
//         );
//       return { signatures, client, config };
//     });
//
//   const channel = client.newChannel(channelName);
//   const orderer = clientUtils(client, context).getOrderer();
//   channel.addOrderer(orderer);
//
//   return await channel.getGenesisBlock().then(
//     () => {
//       console.log(`Got genesis block. Channel: ${channelName} already exists`);
//       return { status: 'SUCCESS' };
//     },
//     async () =>
//       await client
//         .createChannel({
//           config,
//           signatures,
//           name: channelName,
//           orderer,
//           txId: client.newTransactionID()
//         })
//         .then(result => {
//           console.log(`Channel ${channelName} does not exist yet`);
//           if (result.status === 'SUCCESS') {
//             // console.log(result);
//             return result;
//           } else throw new Error('Failed to create the channel.');
//         })
//   );
// };
