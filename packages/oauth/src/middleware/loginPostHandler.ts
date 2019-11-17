import { Request, Response } from 'express';
import http from 'http-status';
import { OUser } from '../entity/OUser';

export const loginPostHandler = async (req: Request, res: Response) => {
  const email = req.body.email;
  const user = await OUser.findOne({ where: { email } });
  const {
    redirect,
    client_id,
    redirect_uri,
    state,
    grant_type,
    response_type
  } = req.body;
  const path = req.body!.redirect || '/home';
  res.app.locals.user_id = user.id;
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
    : !user
    ? res.render('login', { redirect, client_id, redirect_uri })
    : res.redirect(
        `${path}?client_id=${client_id}&redirect_uri=${redirect_uri}&state=${state}&response_type=${response_type}&grant_type=${grant_type}`
      );
};
