import Express from 'express';
import http from 'http-status';
import { OAuth2Server, Request, Response } from 'oauth2-server-typescript';
import util from 'util';
import { INVALID_GRANT_TYPE, MISSING_CLIENT_ID } from '../types';
import { getLogger, sendToken } from '../utils';

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
  const logger = getLogger({ name: 'tokenHandler.js' });

  if (!req?.body?.client_id) {
    logger.warn('MISSING_CLIENT_ID');

    return res
      .status(http.BAD_REQUEST)
      .send({ ok: false, message: MISSING_CLIENT_ID });
  }

  if (
    req.body.grant_type !== 'password' &&
    req.body.grant_type !== 'refresh_token' &&
    req.body.grant_type !== 'client_credentials' &&
    req.body.grant_type !== 'authorization_code'
  ) {
    logger.warn(INVALID_GRANT_TYPE);

    return res.status(http.BAD_REQUEST).send({
      ok: false,
      message: INVALID_GRANT_TYPE
    });
  }

  if (req.body.grant_type === 'password') {
    if (!req?.body?.username) {
      logger.warn('missing username');

      return res
        .status(http.BAD_REQUEST)
        .send({ ok: false, message: 'missing username' });
    }
    if (!req?.body?.password) {
      logger.warn('missing password');

      return res
        .status(http.BAD_REQUEST)
        .send({ ok: false, message: 'missing password' });
    }
  }

  req.body.scope = req?.body?.scope && 'default';

  await oauth
    .token(new Request(req), new Response(res), options)
    .then(token => {
      logger.info(util.format('token created: %s', req.body.username));

      res.locals.oauth = { token };
      sendToken(res, token.refreshToken);
      res.status(http.OK).send({ ok: true, token });
    })
    .catch(error => {
      logger.warn(util.format('token creation error: %s', error.message));

      res.status(http.BAD_REQUEST).send({ ok: false, message: error.message });
    });

  next();
};
