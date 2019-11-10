import express from 'express';
import { OAuth2Server, Request, Response } from 'oauth2-server-typescript';

export const token = (oauth: OAuth2Server, options?: any) => async (
  req: express.Request,
  res: express.Response
) => {
  const request = new Request(req);
  const response = new Response(res);
  const accessToken = await oauth.token(request, response, options);
  if (accessToken) {
    return res.send({ ok: true, accessToken });
  } else return res.send({ ok: false, accessToken: '' });
};
