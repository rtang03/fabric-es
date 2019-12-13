import { Request, Response } from 'express';
import http from 'http-status';
import {
  MISSING_CLIENT_ID,
  MISSING_GRANT_TYPE,
  MISSING_REDIRECT_URI,
  MISSING_RESPONSE_TYPE,
  MISSING_STATE
} from '../types';

export const authorizeGetHandler = (req: Request, res: Response) => {
  const {
    client_id,
    redirect_uri,
    state,
    response_type,
    grant_type
  } = req.query;
  const redirect = req.path;
  res.locals.user_id = req?.app?.locals?.user_id;
  return !client_id
    ? res.status(http.BAD_REQUEST).send({ message: MISSING_CLIENT_ID })
    : !redirect_uri
    ? res.status(http.BAD_REQUEST).send({ message: MISSING_REDIRECT_URI })
    : !state
    ? res.status(http.BAD_REQUEST).send({ message: MISSING_STATE })
    : !response_type
    ? res.status(http.BAD_REQUEST).send({ message: MISSING_RESPONSE_TYPE })
    : !grant_type
    ? res.status(http.BAD_REQUEST).send({ message: MISSING_GRANT_TYPE })
    : !req?.app?.locals?.user_id
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
