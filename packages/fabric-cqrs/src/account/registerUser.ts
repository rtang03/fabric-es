import { registerAndEnroll } from '@espresso/operator';
import Client, { ChannelEventHub } from 'fabric-client';
import { FileSystemWallet, Gateway, Network, Wallet } from 'fabric-network';
import { logger } from '../peer/utils';
import { getNetwork } from '../services';

export const registerUser: (option: {
  enrollmentId: string;
  enrollmentSecret: string;
  connectionProfile?: string;
  fabricNetwork?: string;
  wallet?: Wallet;
  caAdmin?: string;
}) => any = async ({
  enrollmentId,
  enrollmentSecret,
  connectionProfile = process.env.CONNECTION_PROFILE,
  fabricNetwork = process.env.NETWORK_LOCATION,
  wallet = new FileSystemWallet(process.env.WALLET),
  caAdmin = process.env.CA_ENROLLMENT_ID_ADMIN
}) => {
  Client.setLogger(logger);
  const operator = await registerAndEnroll({
    fabricNetwork,
    connectionProfile,
    wallet
  })({
    identity: caAdmin,
    enrollmentId,
    enrollmentSecret
  });

  const result = await operator.registerAndEnroll();
  operator.disconnect();
  return result;
};

export const bootstrapNetwork: (option: {
  enrollmentId: string;
  enrollmentSecret: string;
  connectionProfile?: string;
  fabricNetwork?: string;
  wallet?: Wallet;
}) => Promise<{
  enrollmentId: string;
  network: Network;
  gateway: Gateway;
  channelHub?: ChannelEventHub;
}> = async ({
  enrollmentId,
  enrollmentSecret,
  connectionProfile,
  fabricNetwork,
  wallet
}) => {
  await registerUser({
    enrollmentId,
    enrollmentSecret,
    connectionProfile,
    fabricNetwork,
    wallet
  });

  return getNetwork({ enrollmentId, channelEventHubExisted: true });
};
