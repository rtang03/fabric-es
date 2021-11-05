import util from 'util';
import { PrivateRepository } from '@fabric-es/fabric-cqrs';
import { ApolloError, AuthenticationError, ForbiddenError } from 'apollo-server';
import { Logger } from 'winston';
import { UNAUTHORIZED_ACCESS, USER_NOT_FOUND } from '../admin/constants';

export const catchResolverErrors: <T = any>(
  fcn: (root, variables, context) => Promise<T>,
  option: { fcnName: string; logger: Logger; useAuth: boolean; useAdmin?: boolean }
) => (root, variables, context) => Promise<T> = <TResult>(
  fcn,
  { fcnName, logger, useAuth, useAdmin = false }
) => async (root, variables, context) => {
  try {
    logger.warn(`MOMOMOMOMOMOMO ${Object.keys(context.dataSources)}`);
    if (useAuth) {
      if (!context?.user_id) {
      // if (context?.user_id) {
      //   return await fcn(root, variables, context); // authenticated with bearer token
      // } else if (context?.accessor && context?.signature && context?.hash && context?.id && context?.pubkey && context?.aclPath && context?.ec) {
      //   const { accessor, signature, hash, id, pubkey, aclPath, ec } = context;

      //   if (ec.keyFromPublic(pubkey, 'hex').verify(hash, signature)) {
      //     logger.info(`Request confirmed to be originated from ${accessor}`); // TODO: 'info' or 'debug'

      //     // check if accessor entitle to access
      //     try {
      //       await getAcl(aclPath, id, accessor);
      //     } catch (err) {
      //       logger.warn(`${fcnName}, ${err}`);
      //       return new ApolloError(err);
      //     }

      //     return await fcn(root, variables, context);
      //   } else {
      //     logger.warn(`${fcnName}, ${UNAUTHORIZED_ACCESS}`);
      //     return new ForbiddenError(UNAUTHORIZED_ACCESS);
      //   }
      // }

        logger.warn(`${fcnName}, ${USER_NOT_FOUND}`);
        return new AuthenticationError(USER_NOT_FOUND);
      }
    }

    if (useAdmin) {
      if (!context?.is_admin) {
        logger.warn(`${fcnName}, ${UNAUTHORIZED_ACCESS}`);
        return new ForbiddenError(UNAUTHORIZED_ACCESS);
      }
    }

    return await fcn(root, variables, context);
  } catch (e) {
    logger.error(util.format('fail to %s, %j', fcnName, e));

    return e.error && e.error.message
      ? new ApolloError(e.error.message)
      : e.errors && Array.isArray(e.errors) && e.errors.length > 0 && e.errors[0].message
      ? new ApolloError(e.errors.map((err) => err.message))
      : new ApolloError(e);
  }
};
