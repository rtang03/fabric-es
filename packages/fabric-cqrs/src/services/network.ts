require('dotenv').config();
import { ChannelEventHub } from 'fabric-client';
import {
  DefaultEventHandlerStrategies,
  FileSystemWallet,
  Gateway,
  Network
} from 'fabric-network';
import * as fs from 'fs';
import * as yaml from 'js-yaml';
import * as path from 'path';

export const getNetwork: (config?: {
  connectionProfilePath: string;
  identity: string;
  walletRoot: string;
  wallet: string;
  channelName: string;
  hub: string;
}) => Promise<{
  network: Network;
  gateway: Gateway;
  channelHub: ChannelEventHub;
}> = async (
  { connectionProfilePath, identity, wallet, walletRoot, hub, channelName } = {
    connectionProfilePath: process.env.CONNECTION_PROFILE_PATH,
    identity: process.env.IDENTITY,
    walletRoot: process.env.WALLET_ROOT,
    wallet: process.env.WALLET || 'identity/wallet',
    hub: process.env.CHANNEL_HUB,
    channelName: process.env.CHANNEL_NAME
  }
) => {
  try {
    if (!connectionProfilePath) {
      console.error('Missing CONNECTION_PROFILE_PATH in .env');
      return null;
    }

    if (!identity) {
      console.error('Missing IDENTITY in .env');
      return null;
    }

    if (!walletRoot) {
      console.error('Missing WALLET_ROOT in .env');
      return null;
    }

    if (!wallet) {
      console.error('Missing WALLET in .env');
      return null;
    }

    if (!channelName) {
      console.error('Missing CHANNEL_NAME in .env');
      return null;
    }

    const gateway = await new Gateway();
    const connectionProfile = await yaml.safeLoad(
      fs.readFileSync(connectionProfilePath, 'utf8')
    );
    const connectionOptions = {
      identity,
      wallet: await new FileSystemWallet(path.join(walletRoot, wallet)),
      discovery: { enabled: true, asLocalhost: true },
      eventHandlerOptions: {
        strategy: DefaultEventHandlerStrategies.MSPID_SCOPE_ANYFORTX
      }
    };
    await gateway.connect(connectionProfile, connectionOptions);
    const network = await gateway.getNetwork(channelName);
    const channelHub = await network.getChannel().getChannelEventHub(hub);
    return { network, gateway, channelHub };
  } catch (error) {
    console.error(error);
  }
};
