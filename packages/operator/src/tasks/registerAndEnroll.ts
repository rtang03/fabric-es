import util from 'util';
import { User, Utils } from 'fabric-common';
import { DefaultEventHandlerStrategies, DefaultQueryHandlerStrategies, Gateway, X509Identity } from 'fabric-network';
import {
  CreateNetworkOperatorOption,
  IDENTITY_ALREADY_EXIST,
  MISSING_ENROLLMENTID,
  MISSING_ENROLLMENTSECRET,
  ORG_ADMIN_NOT_EXIST,
  SUCCESS
} from '../types';
import { getClientForOrg } from '../utils';

export const registerAndEnroll: (
  option: CreateNetworkOperatorOption
) => (opt: {
  enrollmentId: string;
  enrollmentSecret: string;
  asLocalhost?: boolean;
  eventHandlerStrategies?: any;
  queryHandlerStrategies?: any;
}) => Promise<{
  disconnect: () => void;
  registerAndEnroll: () => Promise<any>;
}> = option => async ({
  enrollmentId,
  enrollmentSecret,
  asLocalhost = true,
  eventHandlerStrategies = DefaultEventHandlerStrategies.MSPID_SCOPE_ALLFORTX,
  queryHandlerStrategies = DefaultQueryHandlerStrategies.MSPID_SCOPE_SINGLE
}) => {
  if (!enrollmentId) throw new Error(MISSING_ENROLLMENTID);
  if (!enrollmentSecret) throw new Error(MISSING_ENROLLMENTSECRET);

  const logger = Utils.getLogger('[operator] registerAndEnroll.js');
  const { caAdmin, caAdminPW, fabricNetwork, connectionProfile, wallet, mspId } = option;
  const client = await getClientForOrg(connectionProfile, fabricNetwork, mspId);
  const gateway = new Gateway();
  const certificateAuthority = client.getCertificateAuthority();

  if (!mspId) {
    logger.error('mspId not found');
    throw new Error('mspId not found');
  }

  try {
    await gateway.connect(client, {
      identity: caAdmin,
      wallet,
      eventHandlerOptions: { strategy: eventHandlerStrategies },
      queryHandlerOptions: { strategy: queryHandlerStrategies },
      discovery: { asLocalhost, enabled: true }
    });
  } catch (e) {
    logger.error(util.format('fail to connect gateway, %j', e));
    throw new Error(e);
  }

  logger.info(util.format('gateway connected: %s', mspId));

  return {
    disconnect: () => gateway.disconnect(),
    registerAndEnroll: async () => {
      let adminExist;
      let enrollmentIdExist;

      try {
        adminExist = await wallet.get(caAdmin);
      } catch (e) {
        logger.error(e);
        throw new Error(e);
      }

      if (!adminExist) {
        logger.error(ORG_ADMIN_NOT_EXIST);
        throw new Error(ORG_ADMIN_NOT_EXIST);
      }

      try {
        enrollmentIdExist = await wallet.get(enrollmentId);
      } catch (e) {
        logger.error(e);
        throw new Error(e);
      }

      if (enrollmentIdExist) {
        logger.warn(`registerAndEnroll: ${IDENTITY_ALREADY_EXIST}`);
        throw new Error(IDENTITY_ALREADY_EXIST);
      }

      const credentials = (gateway.getIdentity() as X509Identity).credentials;
      const registrar = User.createUser(caAdmin, caAdminPW, mspId, credentials.certificate, credentials.privateKey);

      // Step 1: register new enrollmentId
      try {
        await certificateAuthority.register(
          {
            enrollmentID: enrollmentId,
            enrollmentSecret,
            affiliation: '',
            maxEnrollments: -1,
            role: 'client'
          },
          registrar
        );
      } catch (e) {
        logger.error(util.format('operator fail to register %s: %j', enrollmentId, e));
        return new Error(e);
      }

      logger.info(util.format('register user: %s at %s', enrollmentId, mspId));

      // Step 2: enroll new enrollmentId
      let enroll;

      try {
        enroll = await certificateAuthority.enroll({
          enrollmentID: enrollmentId,
          enrollmentSecret
        });
      } catch (e) {
        logger.error(util.format('operator fail to enroll: %j', e));
        return new Error(e);
      }

      const x509identity: X509Identity = {
        credentials: { certificate: enroll.certificate, privateKey: enroll.key.toBytes() },
        mspId,
        type: 'X.509'
      };

      try {
        await wallet.put(enrollmentId, x509identity);
      } catch (e) {
        logger.error(util.format('operator fail to import: %j', e));
        return new Error(e);
      }

      logger.info(util.format('Enroll user and import wallet: %s at %s', enrollmentId, mspId));

      return {
        status: SUCCESS,
        info: `Successfully register & enroll ${enrollmentId}; and import into the wallet`
      };
    }
  };
};
