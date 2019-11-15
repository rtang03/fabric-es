import Express from 'express';
import {
  OAuth2Server,
  Request,
  Response,
  Token
} from 'oauth2-server-typescript';

export const authenticateHandler = (
  oauth: OAuth2Server,
  options?: any
) => async (
  req: Express.Request,
  res: Express.Response,
  next: Express.NextFunction
) => {
  const request = new Request(req);
  const response = new Response(res);
  const token: Token = await oauth
    .authenticate(request, response, options)
    .catch(error => console.error(error));
  if (token) {
    res.locals.oauth = { token };
    res.status(200).send({ ok: true, authenticated: true });
  } else res.status(200).send({ ok: false, authenticated: false });
  next();
};
