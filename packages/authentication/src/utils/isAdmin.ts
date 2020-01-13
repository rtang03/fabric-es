import { AuthenticationError, ForbiddenError } from 'apollo-server-errors';
import Client from 'fabric-client';
import { MiddlewareFn } from 'type-graphql';
import { OUser } from '../entity/OUser';
import { MyContext } from '../types';

export const isAdmin: MiddlewareFn<MyContext> = async ({ context }, next) => {
  const logger = Client.getLogger('isAdmin.js');

  const id = context.payload?.userId;

  const user = await OUser.findOne({ id });

  if (!user) {
    logger.warn('could not find user');

    throw new AuthenticationError('could not find user');
  }

  if (!user.is_admin) {
    logger.warn('require admin privilege');

    throw new ForbiddenError('require admin privilege');
  }

  return next();
};
