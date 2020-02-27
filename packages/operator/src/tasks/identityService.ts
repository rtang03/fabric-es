import util from 'util';
import Client from 'fabric-client';
import { DefaultEventHandlerStrategies, DefaultQueryHandlerStrategies, Gateway } from 'fabric-network';
import { CreateNetworkOperatorOption } from '../types';

export const identityService = (option: CreateNetworkOperatorOption) => async ({
  caAdmin,
  asLocalhost
}: {
  caAdmin: string;
  asLocalhost: boolean;
}) => {
  const logger = Client.getLogger('identityService.js');

  const { connectionProfile, wallet } = option;
  const gateway = new Gateway();

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

  logger.info(util.format('gateway connected: %s', gateway.getClient().getMspid()));

  const ca = gateway.getClient().getCertificateAuthority();

  const registrar = await gateway.getClient().getUserContext(caAdmin, true);

  const caService = ca.newIdentityService();

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
