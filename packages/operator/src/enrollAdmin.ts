import { readFileSync } from 'fs';
import util from 'util';
import FabricCAServices from 'fabric-ca-client';
import Client from 'fabric-client';
import {
  EnrollAdminOption,
  IDENTITY_ALREADY_EXIST,
  MISSING_CONNECTION_PROFILE,
  MISSING_ENROLLMENTID,
  MISSING_ENROLLMENTSECRET,
  MISSING_FABRIC_NETWORK,
  MISSING_MSPID,
  MISSING_URL,
  MISSING_WALLET,
  SUCCESS,
  WRONG_LABEL
} from './types';
import { getClientForOrg } from './utils';

export const enrollAdmin = async (option: EnrollAdminOption): Promise<any> => {
  const logger = Client.getLogger('enrollAdmin.js');
  const { enrollmentID, enrollmentSecret, caUrl, label, mspId, context } = option;
  const { fabricNetwork, connectionProfile, wallet } = context;

  if (!label) throw new Error(WRONG_LABEL);
  if (!enrollmentID) throw new Error(MISSING_ENROLLMENTID);
  if (!enrollmentSecret) throw new Error(MISSING_ENROLLMENTSECRET);
  if (!mspId) throw new Error(MISSING_MSPID);
  if (!caUrl) throw new Error(MISSING_URL);
  if (!fabricNetwork) throw new Error(MISSING_FABRIC_NETWORK);
  if (!connectionProfile) throw new Error(MISSING_CONNECTION_PROFILE);
  if (!wallet) throw new Error(MISSING_WALLET);

  const orgCaCertPath = `${fabricNetwork}/${mspId}/ca/crypto/ca-cert.pem`;

  const client = await getClientForOrg(connectionProfile, fabricNetwork);

  let cert;

  try {
    cert = readFileSync(orgCaCertPath);
  } catch (e) {
    logger.error(util.format('fail to read organinzation CA cert, %j', e));
    throw new Error(e);
  }

  const caService: FabricCAServices = new FabricCAServices(
    caUrl,
    { trustedRoots: Buffer.from(cert), verify: false },
    null,
    // note: 2.0.0.beta seems wrong typing in ICryptoSuite
    client.getCryptoSuite() as any
  );

  // todo: in V2, wallet.exist() is deprecated, and replaced by wallet.get()
  const walletEntry = await wallet.get(label);

  if (!!walletEntry)
    return {
      status: SUCCESS,
      message: `${IDENTITY_ALREADY_EXIST}: "${label}"`
    };

  let key = null;
  let certificate = null;

  try {
    await caService
      .enroll({
        enrollmentID,
        enrollmentSecret
      })
      .then(result => {
        key = result.key;
        certificate = result.certificate;
      });
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
    await wallet.put(label, identity);
  } catch (e) {
    logger.error(util.format('fail to import into wallet %s, %j', label, e));
    throw new Error(e);
  }

  // TO REMOVE
  // try {
  //   await wallet.import(label, X509WalletMixin.createIdentity(client.getMspid(), certificate, key.toBytes()));
  // } catch (e) {
  //   logger.error(util.format('fail to import into wallet %s, %j', label, e));
  //   throw new Error(e);
  // }

  logger.info(`Import identity into wallet: ${label} of ${client.getMspid()}`);

  return {
    status: SUCCESS,
    message: 'Successfully enroll admin and import into the wallet'
  };
};
