import Express from 'express';
import http from 'http-status';
import {
  OAuth2Server,
  Request,
  Response,
  Token
} from 'oauth2-server-typescript';
import { sendRefreshToken } from '../utils';

export const tokenHandler = (
  oauth: OAuth2Server,
  options = {
    requireClientAuthentication: { password: false, refresh_token: false }
  }
) => async (req: Express.Request, res: Express.Response) => {
  const request = new Request(req);
  const response = new Response(res);
  const accessToken: Token = await oauth
    .token(request, response, options)
    .catch(error => console.error(error));
  if (accessToken) {
    // optional
    // res.locals.oauth = { token: accessToken};
    sendRefreshToken(res, accessToken.refreshToken);
    return res.status(200).send({ ok: true, accessToken });
  } else return res.status(200).send({ ok: false, accessToken: '' });
};
