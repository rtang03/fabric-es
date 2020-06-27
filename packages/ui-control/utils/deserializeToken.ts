import Cookie from 'cookie';
import { Request } from 'express';

// todo: "token" is a hardcoded cookie name. Need to change to variable.

// this function is an alternative for cookieParser
// cookieParser returns cookies: { _csrf: 'Aqv40vkLb8q9IxnopVVWsJMi' } in req
// this function will also check if the token is inside authorization header
// this function is not useful, when using ApolloClient
export const deserializeToken = (req: Request) => {
  const cookies = Cookie.parse(req.headers.cookie || '');

  return cookies?.token ? cookies.token : req.headers?.authorization ? req.headers.authorization.split(' ')[1] : null;
};
