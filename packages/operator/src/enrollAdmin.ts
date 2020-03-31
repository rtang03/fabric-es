import { readFileSync } from 'fs';
import util from 'util';
import Client from 'fabric-client';
import { EnrollAdminOption, IDENTITY_ALREADY_EXIST, SUCCESS } from './types';
import { getClientForOrg } from './utils';

export const enrollAdmin = async (option: EnrollAdminOption): Promise<any> => {
  const logger = Client.getLogger('enrollAdmin.js');
  const { enrollmentID, enrollmentSecret, caUrl, mspId, fabricNetwork, connectionProfile, wallet } = option;

  Object.entries(option).forEach(([key, value]) => {
    if (!value) {
      logger.error(`${key} is missing`);
      throw new Error(`${key} is missing`);
    }
  });

  // const orgCaCertPath = `${fabricNetwork}/${mspId}/ca/crypto/ca-cert.pem`;

  const client = await getClientForOrg(connectionProfile, fabricNetwork);

  // let cert;
  //
  // try {
  //   cert = readFileSync(orgCaCertPath);
  // } catch (e) {
  //   logger.error(util.format('fail to read organinzation CA cert, %j', e));
  //   throw new Error(e);
  // }

  const caService = client.getCertificateAuthority();

  // const caService: FabricCAServices = new FabricCAServices(
  //   caUrl,
  //   { trustedRoots: Buffer.from(cert), verify: false },
  //   null,
  //   client.getCryptoSuite() as any
  // );

  const walletEntry = await wallet.get(enrollmentID);

  if (!!walletEntry)
    return {
      status: SUCCESS,
      message: `${IDENTITY_ALREADY_EXIST}: "${enrollmentID}"`
    };

  let [key, certificate] = [null, null];

  try {
    [key, certificate] = await caService
      .enroll({
        enrollmentID,
        enrollmentSecret
      })
      .then(({ key, certificate }) => [key, certificate]);
  } catch (e) {
    logger.error(util.format('fail to enroll %s, %j', enrollmentID, e));
    throw new Error(e);
  }

  logger.info(`${mspId} enrolls ${enrollmentID} at ${caUrl}`);

  const identity = {
    type: 'X.509',
    mspId,
    credentials: {
      certificate,
      privateKey: key.toBytes()
    }
  };

  try {
    await wallet.put(enrollmentID, identity);
  } catch (e) {
    logger.error(util.format('fail to import into wallet %s, %j', enrollmentID, e));
    throw new Error(e);
  }

  logger.info(`Import identity into wallet: ${enrollmentID} of ${client.getMspid()}`);

  return {
    status: SUCCESS,
    message: 'Successfully enroll admin and import into the wallet'
  };
};
