/**
 * @packageDocumentation
 * @hidden
 */
import { registerAndEnroll } from '@fabric-es/operator';
import { Utils } from 'fabric-common';
import { Wallet } from 'fabric-network';

export const registerUser: (option: {
  enrollmentId: string;
  enrollmentSecret: string;
  connectionProfile: string;
  fabricNetwork: string;
  wallet: Wallet;
  caAdmin: string;
  caAdminPW: string;
  mspId: string;
}) => any = async ({
  enrollmentId,
  enrollmentSecret,
  connectionProfile,
  fabricNetwork,
  wallet,
  caAdmin,
  caAdminPW,
  mspId
}) => {
  const logger = Utils.getLogger('[fabric-cqrs] registerUser.js');
  const operator = await registerAndEnroll({
    caAdmin,
    caAdminPW,
    channelName: null,
    ordererName: null,
    ordererTlsCaCert: null,
    fabricNetwork,
    connectionProfile,
    wallet,
    mspId
  })({
    enrollmentId,
    enrollmentSecret
  });

  const result = await operator.registerAndEnroll();
  logger.info('registerAndEnroll complete');

  operator.disconnect();
  return result;
};
