import Client from 'fabric-client';
import {
  DefaultEventHandlerStrategies,
  DefaultQueryHandlerStrategies,
  Gateway
} from 'fabric-network';
import util from 'util';
import { CreateNetworkOperatorOption } from '../types';

export const identityService = (option: CreateNetworkOperatorOption) => async ({
  caAdmin,
  asLocalhost
}: {
  caAdmin: string;
  asLocalhost: boolean;
}) => {
  const logger = Client.getLogger('Identity service');
  const { connectionProfile, wallet } = option;
  const gateway = new Gateway();
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

  logger.info(
    util.format('gateway connected: %s', gateway.getClient().getMspid())
  );

  const ca = await gateway.getClient().getCertificateAuthority();
  const registrar = await gateway.getClient().getUserContext(caAdmin, true);
  const caService = ca.newIdentityService();

  if (!caService) throw new Error('unknown error in ca admin service');

  return {
    create: request => caService.create(request, registrar),
    getAll: () => caService.getAll(registrar),
    getByEnrollmentId: (enrollmentId: string) =>
      caService.getOne(enrollmentId, registrar)
  };
};
