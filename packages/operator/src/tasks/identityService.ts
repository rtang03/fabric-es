import util from 'util';
import FabricCAServices, { IIdentityRequest } from 'fabric-ca-client';
import { User } from 'fabric-common';
import { Gateway, X509Identity } from 'fabric-network';
import { CreateNetworkOperatorOption } from '../types';
import { getFabricCaService, getGateway, getLogger } from '../utils';

export const identityService: (
  option: CreateNetworkOperatorOption
) => (option?: {
  asLocalhost: boolean;
}) => Promise<{
  disconnect: () => void;
  create: (request: IIdentityRequest) => Promise<any>;
  getAll: () => Promise<any>;
  getByEnrollmentId: (enrollmentId: string) => Promise<any>;
  deleteOne: (enrollmentId: string) => Promise<any>;
}> = (option) => async ({ asLocalhost } = { asLocalhost: true }) => {
  let gateway: Gateway;
  let caService: FabricCAServices;

  const logger = getLogger({ name: '[operator] identityService.js' });
  const { connectionProfile, caName, wallet, caAdmin, caAdminPW, mspId } = option;

  // use the loaded connection profile
  try {
    gateway = await getGateway({
      connectionProfile,
      identity: caAdmin,
      wallet,
      asLocalhost,
    });
  } catch (e) {
    logger.error(util.format('fail to connect gateway, %j', e));
    throw new Error(e);
  }

  // Create a new CA client for interacting with the CA.
  try {
    caService = await getFabricCaService(connectionProfile, caName);
  } catch (e) {
    logger.error(util.format('fail to newFabricCAServices: %j', e));
    throw new Error(e);
  }

  if (!caService) {
    logger.error('unknown error in finding ca admin service');
    throw new Error('unknown error in finding ca admin service');
  }

  // note: this is new v2 api. The connected gateway will return identity, whicch is loaded from wallet
  // And then create registrar, i.e. CA Admin. User is the new api from fabric-common. The legacy implementation
  // of User from fabric-client is no longer usable.
  const { certificate, privateKey } = (gateway.getIdentity() as X509Identity).credentials;
  const registrar = User.createUser(caAdmin, caAdminPW, mspId, certificate, privateKey);

  const identityService = caService.newIdentityService();

  return {
    disconnect: () => gateway.disconnect(),
    create: (request) => identityService.create(request, registrar),
    deleteOne: (enrollmentId: string) => identityService.delete(enrollmentId, registrar),
    getAll: () => identityService.getAll(registrar),
    getByEnrollmentId: (enrollmentId: string) => identityService.getOne(enrollmentId, registrar),
  };
};
