import util from 'util';
import { ApolloError, AuthenticationError, ForbiddenError } from 'apollo-server';
import { Logger } from 'winston';
import { UNAUTHORIZED_ACCESS, USER_NOT_FOUND } from '../admin/constants';

export const catchErrors: <T = any>(
  fcn: (root, variables, context) => Promise<T>,
  option: { fcnName: string; logger: Logger; useAuth: boolean; useAdmin?: boolean }
) => (root, variables, context) => Promise<T | ApolloError> = <TResult>(
  fcn,
  { fcnName, logger, useAuth, useAdmin = false }
) => async (root, variables, context) => {
  try {
    if (useAuth) {
      if (!context?.user_id) {
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

    if (e.error && e.error.message) return new ApolloError(e.error.message);
    else if (e.errors && Array.isArray(e.errors) && e.errors.length > 0 && e.errors[0].message)
      return new ApolloError(e.errors.map((err) => err.message));
    else return new ApolloError(e);
  }
};
