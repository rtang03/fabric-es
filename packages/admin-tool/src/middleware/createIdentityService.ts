import { IIdentityRequest } from 'fabric-ca-client';
import { FileSystemWallet, Gateway } from 'fabric-network';
import { CaIdentity, Context } from './types';
import { getClientForOrg } from './utils';

export interface ServiceResponse<T = any> {
  result?: T;
  errors?: Array<{ code: number; message: string }>;
  messages?: Array<{ code: number; message: string }>;
  success?: boolean;
}

export const createIdentityService: (
  context?: Context
) => Promise<{
  create: (identityRequest: IIdentityRequest) => Promise<any>;
  getAll: () => Promise<ServiceResponse<{ identities: CaIdentity[] }>>;
  getByEnrollmentId: (
    enrollmentId: string
  ) => Promise<ServiceResponse<CaIdentity>>;
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
    // the addition of overriding type is to avoid false warning during type check
    // the orignal IServiceResponse of Fabric SDK is buggy, is different from
    // the actual return value.
    return {
      // not currently used. Mainly use createUser function instead
      create: request => service.create(request, registrar),
      getAll: () =>
        service.getAll(registrar) as Promise<
          ServiceResponse<{ identities: CaIdentity[] }>
        >,
      getByEnrollmentId: (enrollmentId: string) =>
        service.getOne(enrollmentId, registrar) as Promise<
          ServiceResponse<CaIdentity>
        >
    };
  });
