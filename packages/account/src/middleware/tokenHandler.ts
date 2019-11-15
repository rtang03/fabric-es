import Express from 'express';
import http from 'http-status';
import {
  OAuth2Server,
  Request,
  Response
} from 'oauth2-server-typescript';
import { sendRefreshToken } from '../utils';

export const tokenHandler = (
  oauth: OAuth2Server,
  options = {
    requireClientAuthentication: { password: false, refresh_token: false }
  }
) => async (
  req: Express.Request,
  res: Express.Response,
  next: Express.NextFunction
) => {
  await oauth
    .token(new Request(req), new Response(res), options)
    .then(token => {
      res.locals.oauth = { token };
      sendRefreshToken(res, token.refreshToken);
      res.status(http.OK).send({ ok: true, accessToken: token });
    })
    .catch(error => {
      console.error(error);
      return res.status(http.BAD_REQUEST).send({ ok: false, accessToken: '' });
    });
  next();
};
