import Express from 'express';
import http from 'http-status';
import { OAuth2Server, Request, Response } from 'oauth2-server-typescript';
import { OUser } from '../entity/OUser';

export const authorizeHandler = (oauth: OAuth2Server) => async (
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
  } = req.query;
  const path = req.path;
  if (!req.app.locals.user_id) {
    return res.redirect(
      `/login?redirect=${path}&client_id=${client_id}&redirect_uri=${redirect_uri}&state=${state}&response_type=${response_type}&grant_type=${grant_type}`
    );
  }
  const request = new Request(req);
  const response = new Response(res);
  const code = await oauth
    .authorize(request, response, {
      authenticateHandler: {
        handle: async () => await OUser.findOne({ id: req.app.locals.user_id })
      }
    })
    .catch(error => {
      res.status(http.BAD_REQUEST).send({ ok: false, error });
    });
  if (code) {
    res.locals.oauth = { code };
    res.status(http.OK).send({ ok: true, code });
  } else res.status(http.OK).send({ ok: false, code: null });
  next();
};
