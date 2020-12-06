import util from 'util';
import FabricCAServices from 'fabric-ca-client';
import { X509Identity } from 'fabric-network';
import { EnrollAdminOption, IDENTITY_ALREADY_EXIST, SUCCESS } from './types';
import { getFabricCaService, getLogger } from './utils';

export const enrollAdmin = async (option: EnrollAdminOption): Promise<any> => {
  const logger = getLogger({ name: '[operator] enrollAdmin.js' });
  const { enrollmentID, enrollmentSecret, mspId, caName, connectionProfile, wallet } = option;

  Object.entries(option).forEach(([key, value]) => {
    if (value === undefined) {
      logger.error(`${key} is missing`);
      throw new Error(`${key} is missing`);
    }
  });

  let caService: FabricCAServices;

  // Create a new CA client for interacting with the CA.
  try {
    caService = await getFabricCaService(connectionProfile, caName);
  } catch (e) {
    logger.error(util.format('fail to newFabricCAServices: %j', e));
    throw new Error(e);
  }

  const walletEntry = await wallet.get(enrollmentID);

  // Check to see if we've already enrolled.
  if (!!walletEntry)
    return {
      status: SUCCESS,
      message: `${IDENTITY_ALREADY_EXIST}: "${enrollmentID}"`,
    };

  let identity: X509Identity;

  try {
    const enrollment = await caService.enroll({ enrollmentID, enrollmentSecret });
    identity = {
      type: 'X.509',
      mspId,
      credentials: {
        certificate: enrollment.certificate,
        privateKey: enrollment.key.toBytes(),
      },
    };
  } catch (e) {
    logger.error(util.format('fail to enroll %s, %j', enrollmentID, e));
    throw new Error(e);
  }

  logger.info(`${mspId} enrolls ${enrollmentID}`);

  try {
    await wallet.put(enrollmentID, identity);
  } catch (e) {
    logger.error(util.format('fail to import into wallet %s, %j', enrollmentID, e));
    throw new Error(e);
  }

  logger.info(`Import identity into wallet: ${enrollmentID}`);

  return {
    status: SUCCESS,
    message: 'Successfully enroll admin and import into the wallet',
  };
};
