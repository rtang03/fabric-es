import { FileSystemWallet, Gateway } from 'fabric-network';
import { Context } from './types';
import { getClientForOrg } from './utils';

export const identity: (
  context?: Context
) => Promise<{
  getAll: () => Promise<any>;
  getOne: (enrollmentId: string) => Promise<any>;
}> = async (
  { connectionProfile, wallet } = {
    connectionProfile: process.env.PATH_TO_CONNECTION_PROFILE,
    wallet: new FileSystemWallet('./wallet')
  }
) =>
  getClientForOrg(connectionProfile).then(async admin => {
    const gateway = new Gateway();
    await gateway.connect(admin, {
      wallet,
      identity: 'ca_admin',
      discovery: { enabled: true, asLocalhost: true }
    });
    const ca = await gateway.getClient().getCertificateAuthority();
    const registrar = await gateway
      .getClient()
      .getUserContext('ca_admin', true);
    const service = ca.newIdentityService();
    return {
      getAll: () => service.getAll(registrar),
      getOne: (enrollmentId: string) => service.getOne(enrollmentId, registrar)
    };
  });
