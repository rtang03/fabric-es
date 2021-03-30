import util from 'util';
import { createNetworkOperator, NetworkOperator } from '@fabric-es/operator';
import { ApolloError } from 'apollo-server';
import { Wallet, X509Identity } from 'fabric-network';
import { getLogger } from '..';
import { orgResolvers, userResolvers } from '../common/model';
import { catchResolverErrors } from '../utils/catchResolverErrors';

/**
 * @about create resolvers using Auth0
 * Notice that, in legacy auth-server, wallet is created for each user
 * In this auth0 implementation, only organization administrator requires wallet entry.
 * All user's command is invoked via orgadmin (i.e. enrollmentId) / wallet.
 */
export const createResolversWithAuth0: (option: {
  caAdmin: string;
  caAdminPW: string;
  channelName?: string;
  caName: string;
  connectionProfile: string;
  wallet: Wallet;
  asLocalhost: boolean;
  mspId: string;
  enrollmentSecret: string;
}) => Promise<any> = async ({
  caAdmin,
  caAdminPW,
  caName,
  channelName = 'eventstore',
  connectionProfile,
  wallet,
  asLocalhost,
  mspId,
  enrollmentSecret,
}) => {
  const logger = getLogger('[gw-lib] createResolvers.js');

  let operator: NetworkOperator;

  try {
    operator = await createNetworkOperator({
      caName,
      caAdmin,
      caAdminPW,
      channelName,
      connectionProfile,
      wallet,
      mspId,
    });
  } catch (e) {
    logger.error(util.format('createNetworkOperator error: %j', e));
    throw new Error(e);
  }

  let ca;
  try {
    ca = await operator.identityService({ asLocalhost });
  } catch (e) {
    logger.error(util.format('createNetworkOperator error: %j', e));
    throw new Error(e);
  }

  const { Query: orgQuery, ...orgTypes } = orgResolvers;
  const { Query: usrQuery, Mutation: usrMutation, ...usrTypes } = userResolvers;

  return {
    Mutation: {
      createWallet: catchResolverErrors(
        async (_, __, { enrollment_id }) => {
          const res = await operator.registerAndEnroll({
            enrollmentId: enrollment_id,
            enrollmentSecret,
            asLocalhost,
          });

          const registerResult = await res.registerAndEnroll();

          res.disconnect();

          if (registerResult instanceof Error) {
            logger.error(util.format('createWallet error: %j', registerResult));
            return new ApolloError(registerResult.message);
          }

          return registerResult?.status === 'SUCCESS';
        },
        { fcnName: 'createWallet', logger, useAuth: true, }
      ),
      ...usrMutation,
    },
    Query: {
      isadmin: () => 'echo admin',
      getCaIdentityByUsername: catchResolverErrors(
        async (_, __, { enrollment_id }) =>
          ca.getByEnrollmentId(enrollment_id || '').then(({ result }) =>
            result
              ? {
                  id: result.id,
                  typ: result.type,
                  affiliation: result.affiliation,
                  max_enrollments: result.max_enrollments,
                  attrs: result.attrs,
                }
              : null
          ),
        { fcnName: 'getCaIdentityByEnrollmentId', logger, useAuth: false, }
      ),
      getWallet: catchResolverErrors(
        async (_, __, { enrollment_id }) => {
          const identity = (await wallet.get(enrollment_id)) as X509Identity;
          return identity
            ? {
                type: identity.type,
                mspId: identity.mspId,
                certificate: identity.credentials.certificate,
              }
            : null;
        },
        { fcnName: 'getWallet', logger, useAuth: true }
      ),
      listWallet: catchResolverErrors(async () => wallet.list(), {
        fcnName: 'listWallet',
        logger,
        useAuth: false,
      }),
      ...orgQuery,
      ...usrQuery,
    },
    ...orgTypes,
    ...usrTypes,
  };
};
