import { compare } from 'bcrypt';
import { Request, Response } from 'express';
import Client from 'fabric-client';
import http from 'http-status';
import util from 'util';
import { OUser } from '../entity/OUser';

export const loginPostHandler = async (req: Request, res: Response) => {
  const logger = Client.getLogger('loginPostHandler.js');

  const {
    email,
    password,
    redirect,
    client_id,
    redirect_uri,
    state,
    grant_type,
    response_type
  } = req.body;

  const user = await OUser.findOne({ where: { email } });

  if (!user)
    return res.render('login', {
      redirect,
      client_id,
      redirect_uri,
      message: 'no such user'
    });

  res.app.locals.user_id = user.id;

  if (!password)
    return res.render('login', {
      redirect,
      client_id,
      redirect_uri,
      message: 'bad password'
    });

  const valid = await compare(password, user.password);

  if (!valid) {
    logger.warn(util.format('user & password mis-match: %s', user.id));

    return res.render('login', {
      redirect,
      client_id,
      redirect_uri,
      message: 'bad password'
    });
  }

  const path = req.body!.redirect || '/home';

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
    : res.redirect(
        `${path}?client_id=${client_id}&redirect_uri=${redirect_uri}&state=${state}&response_type=${response_type}&grant_type=${grant_type}`
      );
};
