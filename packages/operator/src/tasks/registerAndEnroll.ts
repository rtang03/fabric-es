import util from 'util';
import { BroadcastResponse } from 'fabric-client';
import Common, { User } from 'fabric-common';
import { DefaultEventHandlerStrategies, DefaultQueryHandlerStrategies, Gateway, X509Identity } from 'fabric-network';
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

export const registerAndEnroll = (option: CreateNetworkOperatorOption) => async ({
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

  const logger = Common.Utils.getLogger('registerAndEnroll.js');
  const { fabricNetwork, connectionProfile, wallet } = option;
  const gateway = new Gateway();
  const client = await getClientForOrg(connectionProfile, fabricNetwork);
  const mspId = client.getMspid();
  const caService = client.getCertificateAuthority();

  if (!mspId) {
    logger.error('mspId not found');
    throw new Error('mspId not found');
  }

  try {
    await gateway.connect(client, {
      identity,
      wallet,
      eventHandlerOptions: { strategy: eventHandlerStrategies },
      queryHandlerOptions: { strategy: queryHandlerStrategies },
      discovery: { asLocalhost, enabled: true }
    });
  } catch (e) {
    logger.error(util.format('fail to connect gateway, %j', e));
    throw new Error(e);
  }

  logger.info(util.format('gateway connected: %s', gateway.getIdentity().mspId));

  // todo: future usage, it may (a) enroll user, w/o register, (b) or register only
  return {
    disconnect: () => gateway.disconnect(),
    registerAndEnroll: async () => {
      const adminExist = await wallet.get(identity);
      if (!adminExist) {
        logger.error(ORG_ADMIN_NOT_EXIST);
        throw new Error(ORG_ADMIN_NOT_EXIST);
      }

      const enrollmentIdExist = await wallet.get(enrollmentId);

      if (enrollmentIdExist) {
        logger.warn(`registerAndEnroll: ${IDENTITY_ALREADY_EXIST}`);
        return new Error(IDENTITY_ALREADY_EXIST);
      }

      const user = new User({ affiliation: '', enrollmentID: '', name: '', roles: [] });

      try {
        await caService.register(
          {
            enrollmentID: enrollmentId,
            enrollmentSecret,
            affiliation: '',
            maxEnrollments: -1,
            role: 'user'
          },
          user
        );
      } catch (e) {
        logger.error(util.format('operator fail to register %s: %j', enrollmentId, e));
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

      let walletImport: any;

      const x509identity: X509Identity = {
        credentials: { certificate, privateKey: key.toBytes() },
        mspId: client.getMspid(),
        type: 'X.509'
      };

      try {
        walletImport = await wallet.put(enrollmentId, x509identity);
      } catch (e) {
        logger.error(util.format('operator fail to import: %j', e));
        return new Error(e);
      }

      logger.info(util.format('Enroll user: %s at %s', enrollmentId, mspId));
      logger.info(util.format('enroll ca user at %s: %j ', mspId, walletImport));

      return {
        status: SUCCESS,
        info: `Successfully register & enroll ${enrollmentId}; and import into the wallet`
      };
    }
  };
};
