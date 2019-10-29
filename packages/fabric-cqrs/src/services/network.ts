import { ChannelEventHub } from 'fabric-client';
import {
  DefaultEventHandlerStrategies,
  DefaultQueryHandlerStrategies,
  FileSystemWallet,
  Gateway,
  Network,
  Wallet
} from 'fabric-network';
import { readFileSync } from 'fs';
import { safeLoad } from 'js-yaml';

export const getNetwork: (option: {
  enrollmentId: string;
  channelName?: string;
  connectionProfile?: string;
  wallet?: Wallet;
  channelEventHub?: string;
  channelEventHubExisted?: boolean;
}) => Promise<{
  enrollmentId: string;
  network: Network;
  gateway: Gateway;
  channelHub?: ChannelEventHub;
}> = async ({
  enrollmentId,
  channelName = 'eventstore',
  connectionProfile = process.env.CONNECTION_PROFILE,
  wallet = new FileSystemWallet(process.env.WALLET || 'assets/wallet'),
  channelEventHub = process.env.CHANNEL_HUB,
  channelEventHubExisted
}) => {
  const identityExist: boolean = await wallet.exists(enrollmentId);
  if (!identityExist) {
    throw new Error('Please register user, before retrying');
  }
  if (!connectionProfile) {
    throw new Error('No connection profile defined.');
  }
  if (!channelEventHub) {
    throw new Error('No channel event hub defined.');
  }

  const gateway = await new Gateway();
  const connect = (identity: string) =>
    gateway
      .connect(safeLoad(readFileSync(connectionProfile, 'utf8')), {
        identity,
        wallet,
        discovery: { enabled: false, asLocalhost: true },
        eventHandlerOptions: {
          strategy: DefaultEventHandlerStrategies.MSPID_SCOPE_ANYFORTX
        },
        queryHandlerOptions: {
          strategy: DefaultQueryHandlerStrategies.MSPID_SCOPE_SINGLE
        }
      })
      .catch(error => {
        console.error(error);
        throw error;
      });

  await connect(enrollmentId);

  const network = await gateway.getNetwork(channelName);

  return channelEventHubExisted
    ? {
        enrollmentId,
        network,
        gateway,
        channelHub: network.getChannel().getChannelEventHub(channelEventHub)
      }
    : { enrollmentId, network, gateway };
};
