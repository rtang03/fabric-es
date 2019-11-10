import express from 'express';
import { OAuth2Server, Request, Response } from 'oauth2-server-typescript';

export const authenticate = (oauth: OAuth2Server, options?: any) => async (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => {
  const request = new Request(req);
  const response = new Response(res);
  return oauth
    .authenticate(request, response, options)
    .then(token => {
      res.locals.oauth = { token };
      next();
    })
    .catch(err => {
      console.error(err);
    });
};
