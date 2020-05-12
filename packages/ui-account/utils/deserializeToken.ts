import Cookie from 'cookie';
import { Request } from 'express';

export const deserializeToken = (req: Request) => {
  const cookies = Cookie.parse(req.headers.cookie || '');

  return cookies?.token ? cookies.token : req.headers?.authorization ? req.headers.authorization.split(' ')[1] : null;
};
