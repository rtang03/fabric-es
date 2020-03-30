import util from 'util';
import FabricCAServices from 'fabric-ca-client';
import Common, { Client, User } from 'fabric-common';
import { DefaultEventHandlerStrategies, DefaultQueryHandlerStrategies, Gateway } from 'fabric-network';
import { CreateNetworkOperatorOption } from '../types';
import { getClientForOrg } from '../utils';

export const identityService = (option: CreateNetworkOperatorOption) => async ({
  caAdmin,
  asLocalhost,
  fabricNetwork
}: {
  caAdmin: string;
  asLocalhost: boolean;
  fabricNetwork: string;
}) => {
  const logger = Common.Utils.getLogger('identityService.js');
  const { connectionProfile, wallet } = option;
  const gateway = new Gateway();

  const client = await getClientForOrg(connectionProfile, fabricNetwork);

  try {
    await gateway.connect(connectionProfile, {
      identity: caAdmin,
      wallet,
      eventHandlerOptions: {
        strategy: DefaultEventHandlerStrategies.MSPID_SCOPE_ALLFORTX
      },
      queryHandlerOptions: {
        strategy: DefaultQueryHandlerStrategies.MSPID_SCOPE_SINGLE
      },
      discovery: { asLocalhost, enabled: true }
    });
  } catch (e) {
    logger.error(util.format('fail to connect gateway, %j', e));
    throw new Error(e);
  }

  logger.info(util.format('gateway connected: %s', gateway.getIdentity().mspId));

  const caService = client.getCertificateAuthority().newIdentityService();

  const registrar = new User({ affiliation: '', enrollmentID: '', name: '', roles: [] });

  if (!caService) {
    logger.error('unknown error in ca admin service');
    throw new Error('unknown error in ca admin service');
  }

  return {
    create: request => caService.create(request, registrar),
    getAll: () => caService.getAll(registrar),
    getByEnrollmentId: (enrollmentId: string) => caService.getOne(enrollmentId, registrar)
  };
};
