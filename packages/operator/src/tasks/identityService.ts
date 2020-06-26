import util from 'util';
import { IIdentityRequest } from 'fabric-ca-client';
import { User } from 'fabric-common';
import {
  DefaultEventHandlerStrategies,
  DefaultQueryHandlerStrategies,
  Gateway,
  X509Identity,
} from 'fabric-network';
import { CreateNetworkOperatorOption } from '../types';
import { getClientForOrg, getLogger } from '../utils';

export const identityService: (
  option: CreateNetworkOperatorOption
) => (option?: {
  asLocalhost: boolean;
}) => Promise<{
  create: (request: IIdentityRequest) => Promise<any>;
  getAll: () => Promise<any>;
  getByEnrollmentId: (enrollmentId: string) => Promise<any>;
  deleteOne: (enrollmentId: string) => Promise<any>;
}> = (option) => async ({ asLocalhost } = { asLocalhost: true }) => {
  const logger = getLogger({ name: '[operator] identityService.js' });
  const { connectionProfile, wallet, fabricNetwork, caAdmin, caAdminPW, mspId } = option;
  const gateway = new Gateway();

  // note: load client from connection profile. This is legacy implementation
  const client = await getClientForOrg(connectionProfile, fabricNetwork, mspId);
  const caService = client.getCertificateAuthority().newIdentityService();

  if (!caService) {
    logger.error('unknown error in finding ca admin service');
    throw new Error('unknown error in finding ca admin service');
  }

  try {
    await gateway.connect(client, {
      identity: caAdmin,
      wallet,
      eventHandlerOptions: {
        strategy: DefaultEventHandlerStrategies.MSPID_SCOPE_ALLFORTX,
      },
      queryHandlerOptions: {
        strategy: DefaultQueryHandlerStrategies.MSPID_SCOPE_SINGLE,
      },
      discovery: { asLocalhost, enabled: true },
    });
  } catch (e) {
    logger.error(util.format('fail to connect gateway, %j', e));
    throw new Error(e);
  }

  // note: this is new v2 api. The connected gateway will return identity, whicch is loaded from wallet
  // And then create registrar, i.e. CA Admin. User is the new api from fabric-common. The legacy implementation
  // of User from fabric-client is no longer usable.
  const { certificate, privateKey } = (gateway.getIdentity() as X509Identity).credentials;
  const registrar = User.createUser(caAdmin, caAdminPW, mspId, certificate, privateKey);

  logger.info(util.format('gateway connected: %s', mspId));

  return {
    create: (request) => caService.create(request, registrar),
    deleteOne: (enrollmentId: string) => caService.delete(enrollmentId, registrar),
    getAll: () => caService.getAll(registrar),
    getByEnrollmentId: (enrollmentId: string) => caService.getOne(enrollmentId, registrar),
  };
};
