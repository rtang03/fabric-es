import { registerAndEnroll } from '@espresso/operator';
import Client, { ChannelEventHub } from 'fabric-client';
import { Gateway, Network, Wallet } from 'fabric-network';
import { getNetwork } from '../services';

export const registerUser: (option: {
  enrollmentId: string;
  enrollmentSecret: string;
  connectionProfile: string;
  fabricNetwork: string;
  wallet: Wallet;
  caAdmin: string;
}) => any = async ({ enrollmentId, enrollmentSecret, connectionProfile, fabricNetwork, wallet, caAdmin }) => {
  const logger = Client.getLogger('registerUser.js');

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
  logger.info('registerAndEnroll complete');

  operator.disconnect();
  return result;
};

export const bootstrapNetwork: (option: {
  enrollmentId: string;
  enrollmentSecret: string;
  connectionProfile: string;
  fabricNetwork: string;
  wallet: Wallet;
  caAdmin: string;
  channelName: string;
  channelEventHub: string;
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
  wallet,
  caAdmin,
  channelName,
  channelEventHub
}) => {
  await registerUser({
    caAdmin,
    enrollmentId,
    enrollmentSecret,
    connectionProfile,
    fabricNetwork,
    wallet
  });

  return getNetwork({
    channelEventHub,
    channelName,
    connectionProfile,
    wallet,
    enrollmentId,
    channelEventHubExisted: true
  });
};
