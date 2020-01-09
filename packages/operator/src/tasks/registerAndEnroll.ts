import Client, { BroadcastResponse } from 'fabric-client';
import {
  DefaultEventHandlerStrategies,
  DefaultQueryHandlerStrategies,
  Gateway,
  X509WalletMixin
} from 'fabric-network';
import util from 'util';
import {
  CreateNetworkOperatorOption,
  IDENTITY_ALREADY_EXIST,
  MISSING_ENROLLMENTID,
  MISSING_ENROLLMENTSECRET,
  MISSING_WALLET_LABEL,
  ORG_ADMIN_NOT_EXIST,
  SUCCESS
} from '../types';
import { getClientForOrg } from '../utils';

export const registerAndEnroll = (
  option: CreateNetworkOperatorOption
) => async ({
  identity,
  enrollmentId,
  enrollmentSecret,
  asLocalhost = true
}: {
  identity: string;
  enrollmentId: string;
  enrollmentSecret: string;
  asLocalhost?: boolean;
}): Promise<BroadcastResponse> => {
  if (!identity) throw new Error(MISSING_WALLET_LABEL);
  if (!enrollmentId) throw new Error(MISSING_ENROLLMENTID);
  if (!enrollmentSecret) throw new Error(MISSING_ENROLLMENTSECRET);

  const logger = Client.getLogger('Register and enroll user');
  const { fabricNetwork, connectionProfile, wallet } = option;

  // TODO: in v2, wallet.exists is deprecated, and replaced by wallet.get()
  const adminExist = await wallet.exists(identity);
  if (!adminExist) throw new Error(ORG_ADMIN_NOT_EXIST);

  const enrollmentIdExist = await wallet.exists(enrollmentId);
  if (!enrollmentIdExist)
    return {
      status: SUCCESS,
      info: IDENTITY_ALREADY_EXIST
    };

  const client = await getClientForOrg(connectionProfile, fabricNetwork);
  const mspId = client.getMspid();
  const gateway = new Gateway();
  await gateway.connect(connectionProfile, {
    identity,
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

  const caService = gateway.getClient().getCertificateAuthority();

  const register = await caService.register(
    {
      enrollmentID: enrollmentId,
      enrollmentSecret,
      affiliation: '',
      maxEnrollments: -1,
      role: 'user'
    },
    gateway.getCurrentIdentity()
  );

  logger.info(util.format('Register user: %s at %s', enrollmentId, mspId));
  logger.debug(util.format('register ca user: %j at %s', register, mspId));

  const { key, certificate } = await caService.enroll({
    enrollmentID: enrollmentId,
    enrollmentSecret
  });

  // TODO: In v2, wallet.import() is deprecated, and replaced by wallet.put()
  const enroll = await wallet.import(
    enrollmentId,
    X509WalletMixin.createIdentity(
      client.getMspid(),
      certificate,
      key.toBytes()
    )
  );

  logger.info(util.format('Enroll user: %s at %s', enrollmentId, mspId));
  logger.debug(util.format('enroll ca user at %s: %j ', mspId, enroll));

  return {
    status: SUCCESS,
    info: `Successfully register & enroll ${enrollmentId}; and import into the wallet`
  };
};
