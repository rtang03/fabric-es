import util from 'util';
import Client from 'fabric-client';
import { promiseToReadFile } from './promiseToReadFile';

export interface CreateAdminOption {
  client: Client;
  orgAdminMspPath: string;
}

export const createAdmin = async (option: CreateAdminOption): Promise<Client.User> => {
  const logger = Client.getLogger('[operator] createAdmin.js');

  const { client, orgAdminMspPath } = option;
  const privateKeyPath = `${orgAdminMspPath}/keystore/key.pem`;
  const signCertPath = `${orgAdminMspPath}/signcerts/cert.pem`;

  logger.error(util.format('client => %j', client));

  const mspid = client.getMspid();

  if (!mspid) {
    logger.error('no mspid found');
    throw new Error('no mspid found');
  }

  let privateKey;
  let signCert;

  try {
    privateKey = await promiseToReadFile(privateKeyPath);
  } catch (e) {
    logger.error(util.format('fail to read private key, %j', e));
    throw new Error(e);
  }

  try {
    signCert = await promiseToReadFile(signCertPath);
  } catch (e) {
    logger.error(util.format('fail to read signCert, %j', e));
    throw new Error(e);
  }

  return client.createUser({
    username: `${client.getMspid()}Admin`,
    mspid,
    cryptoContent: {
      privateKeyPEM: Buffer.from(privateKey).toString(),
      signedCertPEM: Buffer.from(signCert).toString()
    },
    skipPersistence: true
  });
};
