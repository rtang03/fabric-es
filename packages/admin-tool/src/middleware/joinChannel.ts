import * as Client from 'fabric-client';
import { newDefaultKeyValueStore } from 'fabric-client';
import { readFileSync } from 'fs';
import { keys } from 'lodash';
import { join } from 'path';
import { Context } from './types';
import { clientUtils } from './utils';

export const joinChannel: (
  channelName: string,
  context?: Context
) => Promise<any> = async (
  channelName,
  context = {
    kvStorePath: process.env.PATH_TO_CERTS,
    networkId: process.env.NETWORK_ID || 'trade-network',
    pathToNetwork: process.env.PATH_TO_NETWORK,
    pathToNetworkConfig: process.env.PATH_TO_NETWORK_CONFIG
  }
) => {
  const { kvStorePath, pathToNetworkConfig } = context;
  Client.addConfigFile(join(__dirname, pathToNetworkConfig));
  const allHubs = [];
  for (const org of clientUtils(new Client(), context).peerOrgs.slice(0)) {
    // TODO
    const path = kvStorePath + `_${org}`;
    await newDefaultKeyValueStore({ path }).then(async store => {
      const client = new Client();
      client.setStateStore(store);
      const channel = client.newChannel(channelName);
      // const orgDetails = clientUtils(client, context).allOrgs[org]; // TODO
      const orgDetails = clientUtils(client, context).allOrgs.org1;
      const orderer = clientUtils(client, context).getOrderer();
      channel.addOrderer(orderer);
      await clientUtils(client, context)
        .enrolAdmin(orgDetails.name)
        .then(() =>
          channel.getGenesisBlock({ txId: client.newTransactionID() })
        )
        .then(block => {
          console.log('Successfully got the genesis block');
          const targets = [];
          const eventPromises: Array<Promise<any>> = [];
          keys(clientUtils(client, context).allOrgs[org])
            .filter(key => key.startsWith('peer0')) // TODO
            .forEach(key => {
              const { requests, events, hostname, tls_cacerts } = orgDetails[
                key
              ];
              const pem = Buffer.from(
                readFileSync(join(__dirname, tls_cacerts))
              ).toString();
              const peer = client.newPeer(requests, {
                pem,
                'ssl-target-name-override': hostname
              });
              targets.push(peer);
              const hub = channel.newChannelEventHub(
                client.newPeer(events, {
                  pem,
                  'ssl-target-name-override': hostname
                })
              );
              // const hub = channel.getChannelEventHub('org1');
              hub.connect({ full_block: true }, (err, status) => {
                if (err) console.log(err);
                else console.log('Channel hub connected');
              });
              allHubs.push(hub);
              eventPromises.push(
                new Promise((resolve, reject) => {
                  const handle = setTimeout(reject, 40000);
                  hub.registerBlockEvent((block: any) => {
                    clearTimeout(handle);
                    if (block.data.data.length === 1) {
                      const channel_header =
                        block.data.data[0].paylaod.header.channel_header;
                      if (channel_header.channel_id === channelName) {
                        console.log(
                          `New channel joined on ${hub.getPeerAddr()}`
                        );
                        resolve();
                      } else {
                        console.log('New channel is not succesfully joined');
                        reject();
                      }
                    }
                  });
                })
              );
            });
          const txId = client.newTransactionID();
          const sendPromise = channel.joinChannel(
            { targets, block, txId },
            40000
          );
          return Promise.all([sendPromise].concat(eventPromises));
        })
        .then(results => {
          console.log(results);
          if (
            results[0] &&
            results[0][0] &&
            results[0][0].response &&
            results[0][0].response.status === 200
          ) {
            console.log(`Successfully joined peers in ${org}`);
          } else {
            console.log(' Failed to join channel');
            throw new Error('Failed to join channel');
          }
        });
    });
  }
  return { status: 'SUCCESS' };
};
