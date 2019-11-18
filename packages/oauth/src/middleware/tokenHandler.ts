import Express from 'express';
import http from 'http-status';
import { OAuth2Server, Request, Response } from 'oauth2-server-typescript';
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
  if (!req.body.client_id)
    return res
      .status(http.BAD_REQUEST)
      .send({ ok: false, message: 'missing client_id' });

  if (
    req.body.grant_type !== 'password' &&
    req.body.grant_type !== 'refresh_token' &&
    req.body.grant_type !== 'client_credentials'
  )
    return res.status(http.BAD_REQUEST).send({
      ok: false,
      message: 'invalid grant type, use "password" or "refresh_token", "client_credentials"'
    });

  if (req.body.grant_type === 'password') {
    if (!req.body.username)
      return res
        .status(http.BAD_REQUEST)
        .send({ ok: false, message: 'missing username' });
    if (!req.body.password)
      return res
        .status(http.BAD_REQUEST)
        .send({ ok: false, message: 'missing password' });
  }

  req.body.scope = req.body.scope && 'default';

  await oauth
    .token(new Request(req), new Response(res), options)
    .then(token => {
      res.locals.oauth = { token };
      sendRefreshToken(res, token.refreshToken);
      res.status(http.OK).send({ ok: true, token });
    })
    .catch(error => {
      return res.status(http.BAD_REQUEST).send({ ok: false, token: '', message: error.message });
    });

  next();
};
