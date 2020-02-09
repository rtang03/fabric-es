import FabricCAServices from 'fabric-ca-client';
import Client from 'fabric-client';
import { X509WalletMixin } from 'fabric-network';
import { readFileSync } from 'fs';
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
  const {
    enrollmentID,
    enrollmentSecret,
    caUrl,
    label,
    mspId,
    context
  } = option;
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

  const caService = new FabricCAServices(
    caUrl,
    { trustedRoots: Buffer.from(readFileSync(orgCaCertPath)), verify: false },
    null,
    client.getCryptoSuite()
  );

  // todo: in V2, wallet.exist() is deprecated, and replaced by wallet.get()
  // const walletEntry = await wallet.get(label);

  const walletEntry = await wallet.exists(label);

  if (!!walletEntry)
    return {
      status: SUCCESS,
      message: `${IDENTITY_ALREADY_EXIST}: "${label}"`
    };

  const { key, certificate } = await caService.enroll({
    enrollmentID,
    enrollmentSecret
  });

  logger.info(`${mspId} enrolls ${enrollmentID} at ${caUrl}`);

  // todo: in V2,  X509WalletMixin is deprecated, and replaced by below
  // const identity: X509Identity = {
  //   type: 'X.509',
  //   mspId: client.getMspid(),
  //   credentials: {
  //     certificate,
  //     privateKey: key.toBytes()
  //   }
  // };
  // await wallet.put(label, identity);

  await wallet.import(
    label,
    X509WalletMixin.createIdentity(
      client.getMspid(),
      certificate,
      key.toBytes()
    )
  );

  logger.info(`Import identity into wallet: ${label} of ${client.getMspid()}`);

  return {
    status: SUCCESS,
    message: 'Successfully enroll admin and import into the wallet'
  };
};
