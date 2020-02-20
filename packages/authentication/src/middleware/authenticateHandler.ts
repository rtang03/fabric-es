import Express from 'express';
import http from 'http-status';
import { OAuth2Server, Request, Response } from 'oauth2-server-typescript';
import util from 'util';
import { AUTHENTICATION_FAIL, AUTHENTICATION_SUCCESS } from '../types';
import { getLogger } from '../utils';

export const authenticateHandler = (
  oauth: OAuth2Server,
  options?: any
) => async (
  req: Express.Request,
  res: Express.Response,
  next: Express.NextFunction
) => {
  const logger = getLogger({ name: 'authenticateHandler.js' });

  await oauth
    .authenticate(new Request(req), new Response(res), options)
    .then(token => {
      res.locals.oauth = { token };
      if (token) {
        logger.debug(
          util.format('%s: %s', AUTHENTICATION_SUCCESS, token?.user?.id)
        );

        res.status(http.OK).send({
          ok: true,
          authenticated: true,
          user_id: token.user.id,
          is_admin: token.user.is_admin,
          client_id: token.user.client_id
        });
      } else {
        logger.warn(util.format('%s: %s', AUTHENTICATION_FAIL));

        res.status(http.OK).send({ ok: true, authenticated: false });
      }
    })
    .catch(({ message }) => {
      logger.warn(util.format('%s: ', AUTHENTICATION_FAIL));

      res.status(401).send({ ok: false, authenticated: false, message });
    });
  next();
};
