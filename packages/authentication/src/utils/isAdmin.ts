import { AuthenticationError, ForbiddenError } from 'apollo-server-errors';
import { MiddlewareFn } from 'type-graphql';
import { OUser } from '../entity/OUser';
import { MyContext } from '../types';

export const isAdmin: MiddlewareFn<MyContext> = async ({ context }, next) => {
  const id = context.payload?.userId;
  const user = await OUser.findOne({ id });
  if (!user) throw new AuthenticationError('could not find user');
  if (!user.is_admin) throw new ForbiddenError('require admin privilege');
  return next();
};
