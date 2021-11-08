import util from 'util';
import { ApolloError, AuthenticationError, ForbiddenError } from 'apollo-server';
import { Logger } from 'winston';
import { UNAUTHORIZED_ACCESS, USER_NOT_FOUND } from '../admin/constants';
import { getAcl } from './aclService';

export const catchResolverErrors: <T = any>(
  fcn: (root, variables, context) => Promise<T>,
  option: { fcnName: string; logger: Logger; useAuth: boolean; useAdmin?: boolean; privateEntityName?: string }
) => (root, variables, context) => Promise<T> = <TResult>(
  fcn,
  { fcnName, logger, useAuth, useAdmin = false, privateEntityName = null }
) => async (root, variables, context) => {
  try {
    if (useAuth) {
      if (context?.user_id) {
        return await fcn(root, variables, context); // authenticated with bearer token
      } else if (privateEntityName !== null) { // (context?.accessor && context?.signature && context?.hash && context?.id && context?.pubkey && context?.aclPath && context?.ec) {
        const { accessor, signature, hash, id, pubkey, ec, dataSources } = context;
        if (!dataSources[privateEntityName] || !dataSources[privateEntityName].isPrivate) {
          // useAuth is true, not login locally (user_id is empty), but not setup properly (need private-entity-name)
          logger.warn(`${fcnName}, ${UNAUTHORIZED_ACCESS}`);
          return new ForbiddenError(UNAUTHORIZED_ACCESS);
        }

        if (ec.keyFromPublic(pubkey, 'hex').verify(hash, signature)) {
          logger.info(`Request confirmed to be originated from ${accessor}`); // TODO: 'info' or 'debug'

          // check if accessor entitle to access
          try {
            const acl = await getAcl(id, accessor, dataSources[privateEntityName].repo);
            if (!acl || acl.status !== 'A') {
              logger.warn(`${fcnName}, ${UNAUTHORIZED_ACCESS}`);
              return new ForbiddenError(UNAUTHORIZED_ACCESS);
            }
          } catch (err) {
            logger.warn(`${fcnName}, ${err}`);
            return new ApolloError(err);
          }

          return await fcn(root, variables, context);
        } else {
          logger.warn(`${fcnName}, ${UNAUTHORIZED_ACCESS}`);
          return new ForbiddenError(UNAUTHORIZED_ACCESS);
        }
      }

      logger.warn(`${fcnName}, ${USER_NOT_FOUND}`);
      return new AuthenticationError(USER_NOT_FOUND);
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
