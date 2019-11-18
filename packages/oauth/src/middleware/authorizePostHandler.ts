import Express from 'express';
import http from 'http-status';
import { OAuth2Server, Request, Response } from 'oauth2-server-typescript';
import { AuthorizationCode } from 'oauth2-server-typescript';
import { OUser } from '../entity/OUser';

export const authorizePostHandler = (
  oauth: OAuth2Server,
  options: any = {}
) => async (
  req: Express.Request,
  res: Express.Response,
  next: Express.NextFunction
) => {
  const {
    client_id,
    redirect_uri,
    state,
    response_type,
    grant_type
  } = req.body;
  const path = req.path;
  if (!req?.app?.locals?.user_id) {
    return res.redirect(
      `/login?redirect=${path}&client_id=${client_id}&redirect_uri=${redirect_uri}&state=${state}&response_type=${response_type}&grant_type=${grant_type}`
    );
  }
  options.authenticateHandler = {
    handle: async () =>
      req!.app!.locals!.user_id
        ? await OUser.findOne({ id: req.app.locals.user_id })
        : { id: null }
  };
  await oauth
    .authorize(new Request(req), new Response(res), options)
    .then((code: AuthorizationCode) => {
      res.locals.oauth = { code };
      res.redirect(
        `${code.redirectUri}?code=${code.authorizationCode}?state=${state}`
      );
    })
    .catch(error => {
      console.error(error);
      return res.status(http.BAD_REQUEST).send({ ok: false, error });
    });
  next();
};
