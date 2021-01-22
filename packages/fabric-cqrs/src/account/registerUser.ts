/**
 * @packageDocumentation
 * @hidden
 */
import { registerAndEnroll } from '@fabric-es/operator';
import { Utils } from 'fabric-common';
import { Wallet } from 'fabric-network';

/**
 * Register new user upon Fabric CA server
 * @param enrollmentId
 * @param enrollmentSecret
 * @param connectionProfile
 * @param wallet
 * @param caName
 * @param caAdmin
 * @param caAdminPW
 * @param mspId
 */
export const registerUser: (option: {
  enrollmentId: string;
  enrollmentSecret: string;
  connectionProfile: string;
  wallet: Wallet;
  caName: string;
  caAdmin: string;
  caAdminPW: string;
  mspId: string;
}) => any = async ({
  enrollmentId,
  enrollmentSecret,
  connectionProfile,
  wallet,
  caName,
  caAdmin,
  caAdminPW,
  mspId,
}) => {
  const logger = Utils.getLogger('[fabric-cqrs] registerUser.js');
  const operator = await registerAndEnroll({
    caName,
    caAdmin,
    caAdminPW,
    channelName: null,
    connectionProfile,
    wallet,
    mspId,
  })({
    enrollmentId,
    enrollmentSecret,
  });

  const result = await operator.registerAndEnroll();
  logger.info('registerAndEnroll complete');

  operator.disconnect();
  return result;
};
