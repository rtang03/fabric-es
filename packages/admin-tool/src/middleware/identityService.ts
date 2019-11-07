import { IIdentityRequest } from 'fabric-ca-client';
import { FileSystemWallet, Gateway } from 'fabric-network';
import { Context } from './types';
import { getClientForOrg } from './utils';

export interface ServiceResponse {
  result?: any;
  errors?: Array<{ code: number; message: string }>;
  messages?: Array<{ code: number; message: string }>;
  success?: boolean;
}

export const identityService: (
  context?: Context
) => Promise<{
  create: (identityRequest: IIdentityRequest) => Promise<any>;
  getAll: () => Promise<ServiceResponse>;
  getOne: (enrollmentId: string) => Promise<ServiceResponse>;
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
      create: request => service.create(request, registrar),
      getAll: () => service.getAll(registrar) as Promise<ServiceResponse>,
      getOne: (enrollmentId: string) => service.getOne(enrollmentId, registrar) as Promise<ServiceResponse>
    };
  });
