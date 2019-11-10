import express from 'express';
import { OAuth2Server, Request, Response } from 'oauth2-server-typescript';
import util from 'util';

export const authorize = (oauth: OAuth2Server, options?: any) => (
  req: express.Request,
  res: express.Response
) => {
  // Redirect anonymous users to login page.
  if (!req.app.locals.user) {
    return res.redirect(
      util.format(
        '/login?client_id=%s&redirect_uri=%s',
        req.query.client_id,
        req.query.redirect_uri
      )
    );
  }
  const request = new Request(req);
  const response = new Response(res);
  return oauth.authorize(request, response, options);
};
