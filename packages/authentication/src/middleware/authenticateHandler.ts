import Express from 'express';
import http from 'http-status';
import { OAuth2Server, Request, Response } from 'oauth2-server-typescript';

export const authenticateHandler = (
  oauth: OAuth2Server,
  options?: any
) => async (
  req: Express.Request,
  res: Express.Response,
  next: Express.NextFunction
) => {
  await oauth
    .authenticate(new Request(req), new Response(res), options)
    .then(token => {
      res.locals.oauth = { token };
      if (token)
        res
          .status(http.OK)
          .send({
            ok: true,
            authenticated: true,
            user_id: token.user.id,
            is_admin: token.user.is_admin,
            client_id: token.user.client_id
          });
      else res.status(http.OK).send({ ok: true, authenticated: false });
    })
    .catch(error => {
      console.error(error);
      return res
        .status(http.BAD_REQUEST)
        .send({ ok: false, authenticated: false });
    });
  next();
};
