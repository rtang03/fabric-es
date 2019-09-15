import * as Client from 'fabric-client';
import {
  newCryptoKeyStore,
  newCryptoSuite,
  newDefaultKeyValueStore
} from 'fabric-client';
import { readdirSync, readFileSync } from 'fs';
import { keys } from 'lodash';
import { join } from 'path';
import '../env';
import { NetworkConfig } from './types';

const readAllFiles = dir => {
  const files = readdirSync(dir);
  const certs = [];
  files.forEach(filename => {
    certs.push(readFileSync(join(dir, filename)));
  });
  return certs;
};

const clientUtils = (
  client: Client,
  { networkId, pathToNetwork }: Context
) => ({
  allOrgs: client.getConfigSetting(networkId),
  peerOrgs: keys(client.getConfigSetting(networkId)).filter(
    org => org !== 'orderer'
  ),
  getAdmin: (org: string) => {
    const keyPath = join(
      __dirname,
      `${pathToNetwork}/${org}/admin/msp/keystore`
    );
    const keyPEM = Buffer.from(readAllFiles(keyPath)[0]);
    const certPath = join(
      __dirname,
      `${pathToNetwork}/${org}/admin/msp/signcerts`
    );
    const certPEM = readAllFiles(certPath)[0];
    const ORGS: NetworkConfig = client.getConfigSetting(networkId);
    return Promise.resolve(
      client.createUser({
        username: `peer${org}Admin`,
        mspid: ORGS[org].mspid,
        cryptoContent: {
          privateKeyPEM: keyPEM.toString(),
          signedCertPEM: certPEM.toString()
        },
        skipPersistence: false
      })
    );
  }
});

const enrollAdminNSignConfig = ({
  org,
  client,
  config,
  context
}: {
  org: string;
  client: Client;
  config: Buffer;
  context?: Context;
}) =>
  clientUtils(client, context)
    .getAdmin(org)
    .then(admin => client.signChannelConfig(config));

interface Context {
  kvStorePath: string;
  networkId: string;
  pathToChannelTx: string;
  pathToNetwork: string;
}
export const createChannel = async (
  channelName: string,
  org: string,
  context: Context = {
    kvStorePath: `${process.env.PATH_TO_CERTS}_${org}`,
    networkId: process.env.NETWORK_ID || 'trade-network',
    pathToChannelTx: process.env.PATH_TO_CHANNEL_CONFIG,
    pathToNetwork: process.env.PATH_TO_NETWORK
  }
) => {
  const { kvStorePath, pathToChannelTx } = context;
  const { client, config, signatures } = await newDefaultKeyValueStore({
    path: kvStorePath
  })
    .then(store => {
      Client.addConfigFile(join(__dirname, 'config.json'));
      Client.setConfigSetting(
        'key-value-store',
        'fabric-client/lib/impl/FileKeyValueStore.js'
      );
      const cryptoSuite = newCryptoSuite();
      cryptoSuite.setCryptoKeyStore(newCryptoKeyStore({ path: kvStorePath }));
      const client = new Client();
      client.setStateStore(store);
      client.setCryptoSuite(cryptoSuite);
      console.log('Successfully extracted the config from the configtx');
      return client;
    })
    .then(async client => {
      const signatures = [];
      const envelope = readFileSync(join(__dirname, pathToChannelTx));
      const config = client.extractChannelConfig(envelope);
      for (const org of clientUtils(client, context).peerOrgs)
        signatures.push(
          await enrollAdminNSignConfig({ org, client, config, context })
        );
      return { signatures, client, config };
    });

  const channel = client.newChannel(channelName);
  const { url, tls_cacerts, hostname } = clientUtils(
    client,
    context
  ).allOrgs.orderer;
  const pem = Buffer.from(
    readFileSync(join(__dirname, tls_cacerts))
  ).toString();
  const orderer = client.newOrderer(url, {
    pem,
    'ssl-target-name-override': hostname
  });
  channel.addOrderer(orderer);

  return await channel.getGenesisBlock().then(
    () => {
      console.log(`Got genesis block. Channel: ${channelName} already exists`);
      return { status: 'SUCCESS' };
    },
    async () =>
      await client
        .createChannel({
          config,
          signatures,
          name: channelName,
          orderer,
          txId: client.newTransactionID()
        })
        .then(
          result => {
            console.log(`Channel ${channelName} does not exist yet`);
            console.log(`Channel creation complete; response: `);
            console.log(result);
            if (result.status === 'SUCCESS') {
              console.log('Successfully created the channel.');
            } else throw new Error('Failed to create the channel.');
          },
          err => {
            throw new Error(
              'Failed to create the channel: ' + err.stack ? err.stack : err
            );
          }
        )
  );
};
