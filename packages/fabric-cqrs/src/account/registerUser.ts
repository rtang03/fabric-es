import { registerAndEnroll as prepare } from '@espresso/operator';
import Client, { ChannelEventHub } from 'fabric-client';
import { FileSystemWallet, Gateway, Network, Wallet } from 'fabric-network';
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
  const logger = Client.getLogger('registerUser.js');

  const operator = await prepare({
    fabricNetwork,
    connectionProfile,
    wallet
  })({
    identity: caAdmin,
    enrollmentId,
    enrollmentSecret
  });

  const result = await operator.registerAndEnroll();
  logger.info('registerAndEnroll complete');

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
