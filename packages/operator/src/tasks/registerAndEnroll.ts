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
  asLocalhost = true,
  eventHandlerStrategies = DefaultEventHandlerStrategies.MSPID_SCOPE_ALLFORTX,
  queryHandlerStrategies = DefaultQueryHandlerStrategies.MSPID_SCOPE_SINGLE
}: {
  identity: string;
  enrollmentId: string;
  enrollmentSecret: string;
  asLocalhost?: boolean;
  eventHandlerStrategies?: any;
  queryHandlerStrategies?: any;
}): Promise<{
  disconnect: () => void;
  registerAndEnroll: () => Promise<BroadcastResponse | Error>;
}> => {
  if (!identity) throw new Error(MISSING_WALLET_LABEL);
  if (!enrollmentId) throw new Error(MISSING_ENROLLMENTID);
  if (!enrollmentSecret) throw new Error(MISSING_ENROLLMENTSECRET);

  const logger = Client.getLogger('registerAndEnroll.js');

  const { fabricNetwork, connectionProfile, wallet } = option;
  const client = await getClientForOrg(connectionProfile, fabricNetwork);
  const mspId = client.getMspid();
  const gateway = new Gateway();
  await gateway.connect(client, {
    identity,
    wallet,
    eventHandlerOptions: { strategy: eventHandlerStrategies },
    queryHandlerOptions: { strategy: queryHandlerStrategies },
    discovery: { asLocalhost, enabled: true }
  });

  logger.info(
    util.format('gateway connected: %s', gateway.getClient().getMspid())
  );

  const caService = gateway.getClient().getCertificateAuthority();

  // todo: future usage, it may (a) enroll user, w/o register, (b) or register only
  return {
    disconnect: () => gateway.disconnect(),
    registerAndEnroll: async () => {
      // TODO: in v2, wallet.exists is deprecated, and replaced by wallet.get()
      const adminExist = await wallet.exists(identity);
      if (!adminExist) throw new Error(ORG_ADMIN_NOT_EXIST);

      const enrollmentIdExist = await wallet.exists(enrollmentId);

      if (enrollmentIdExist) {
        logger.warn(`registerAndEnroll: ${IDENTITY_ALREADY_EXIST}`);
        return new Error(IDENTITY_ALREADY_EXIST);
      }

      try {
        await caService.register(
          {
            enrollmentID: enrollmentId,
            enrollmentSecret,
            affiliation: '',
            maxEnrollments: -1,
            role: 'user'
          },
          gateway.getCurrentIdentity()
        );
      } catch (e) {
        logger.error(util.format('operator fail to register: %j', e));
        return new Error(e);
      }

      logger.info(util.format('register user: %s at %s', enrollmentId, mspId));

      let key: any;
      let certificate: any;

      try {
        const enroll = await caService.enroll({
          enrollmentID: enrollmentId,
          enrollmentSecret
        });
        key = enroll.key;
        certificate = enroll.certificate;
      } catch (e) {
        logger.error(util.format('operator fail to enroll: %j', e));
        return new Error(e);
      }

      // TODO: In v2, wallet.import() is deprecated, and replaced by wallet.put()
      let walletImport: any;
      try {
        walletImport = await wallet.import(
          enrollmentId,
          X509WalletMixin.createIdentity(
            client.getMspid(),
            certificate,
            key.toBytes()
          )
        );
      } catch (e) {
        logger.error(util.format('operator fail to import: %j', e));
        return new Error(e);
      }

      logger.info(util.format('Enroll user: %s at %s', enrollmentId, mspId));
      logger.debug(
        util.format('enroll ca user at %s: %j ', mspId, walletImport)
      );

      return {
        status: SUCCESS,
        info: `Successfully register & enroll ${enrollmentId}; and import into the wallet`
      };
    }
  };
};
