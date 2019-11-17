import { Request, Response } from 'express';
import http from 'http-status';

export const authorizePostHandler = (req: Request, res: Response) => {
  const {
    client_id,
    redirect_uri,
    state,
    response_type,
    grant_type
  } = req.query;
  const redirect = req.path;
  res.locals.user_id = req!.app!.locals!.user_id;
  return !client_id
    ? res.status(http.BAD_REQUEST).send({ error: 'client_id is missing' })
    : !redirect_uri
    ? res.status(http.BAD_REQUEST).send({ error: 'redirect_uri is missing' })
    : !state
    ? res.status(http.BAD_REQUEST).send({ error: 'state is missing' })
    : !response_type
    ? res.status(http.BAD_REQUEST).send({ error: 'response_type is missing' })
    : !grant_type
    ? res.status(http.BAD_REQUEST).send({ error: 'grant_type is missing' })
    : !req.app.locals.user_id
    ? res.redirect(
        `/login?redirect=${redirect}&client_id=${client_id}&redirect_uri=${redirect_uri}&state=${state}&response_type=${response_type}&grant_type=${grant_type}`
      )
    : res.render('authorize', {
        redirect,
        client_id,
        redirect_uri,
        state,
        response_type,
        grant_type
      });
};
