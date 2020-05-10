import util from 'util';
import { ApolloError, AuthenticationError, ForbiddenError } from 'apollo-server';
import { Logger } from 'winston';
import { UNAUTHORIZED_ACCESS, USER_NOT_FOUND } from '../admin/constants';

export const catchErrors: (
  fcn: (root, variables, context) => Promise<any>,
  option: { fcnName: string; logger: Logger; useAuth: boolean; useAdmin: boolean }
) => (root, variables, context) => void = (fcn, { fcnName, logger, useAuth, useAdmin }) => async (
  root,
  variables,
  context
) => {
  try {
    logger.info(`getWallet invoked: ${context.username}`);

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

    return fcn(root, variables, context);
  } catch (e) {
    logger.error(util.format('fail to %s, %j', fcnName, e));
    return new ApolloError(e);
  }
};
