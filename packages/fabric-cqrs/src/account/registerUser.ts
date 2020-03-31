/**
 * @packageDocumentation
 * @hidden
 */
import { registerAndEnroll } from '@fabric-es/operator';
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
  caAdminPW: string;
}) => any = async ({
  enrollmentId,
  enrollmentSecret,
  connectionProfile,
  fabricNetwork,
  wallet,
  caAdmin,
  caAdminPW
}) => {
  const logger = Client.getLogger('[fabric-cqrs] registerUser.js');
  const operator = await registerAndEnroll({
    caAdmin,
    caAdminPW,
    channelName: null,
    ordererName: null,
    ordererTlsCaCert: null,
    fabricNetwork,
    connectionProfile,
    wallet
  })({
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
  caAdminPW: string;
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
  caAdminPW,
  channelName,
  channelEventHub
}) => {
  await registerUser({
    caAdmin,
    caAdminPW,
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
