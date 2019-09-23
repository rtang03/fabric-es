import { ChannelEventHub } from 'fabric-client';
import {
  DefaultEventHandlerStrategies,
  DefaultQueryHandlerStrategies,
  FileSystemWallet,
  Gateway,
  Network
} from 'fabric-network';
import { readFileSync } from 'fs';
import { safeLoad } from 'js-yaml';
import '../env';

export const getNetwork: (option: {
  identity: string;
  channelName?: string;
}) => Promise<{
  identity: string;
  network: Network;
  gateway: Gateway;
  channelHub: ChannelEventHub;
}> = async ({ identity, channelName }) => {
  const wallet = new FileSystemWallet(process.env.WALLET || 'assets/wallet');
  const connectionProfile = process.env.CONNECTION_PROFILE;
  const hub = process.env.CHANNEL_HUB;
  const identityExist = await wallet.exists(identity);
  if (!identityExist) {
    throw new Error('Please register user, before retrying');
  }
  if (!connectionProfile) {
    throw new Error('No connection profile defined.');
  }
  if (!hub) {
    throw new Error('No channel event hub defined.');
  }

  const gateway = await new Gateway();
  await gateway.connect(safeLoad(readFileSync(connectionProfile, 'utf8')), {
    identity,
    wallet,
    discovery: { enabled: false, asLocalhost: true },
    eventHandlerOptions: {
      strategy: DefaultEventHandlerStrategies.MSPID_SCOPE_ANYFORTX
    },
    queryHandlerOptions: {
      strategy: DefaultQueryHandlerStrategies.MSPID_SCOPE_SINGLE
    }
  });
  const network = await gateway.getNetwork(channelName || 'eventstore');
  const channelHub = network.getChannel().getChannelEventHub(hub);
  return { identity, network, gateway, channelHub };
};
