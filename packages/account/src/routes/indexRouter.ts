import express from 'express';
import http from 'http-status';
import { OAuth2Server } from 'oauth2-server-typescript/lib/server';
import { OUser } from '../entity/OUser';
import {
  authenticateHandler,
  authorizeHandler,
  tokenHandler
} from '../middleware';

export const indexRouter = (oauthServer: OAuth2Server) => {
  const router = express.Router();
  router.get('/', (_, res) => {
    res.render('index', { title: 'Authorization Server' });
  });
  router.post('/token', tokenHandler(oauthServer));
  router.post('/refresh_token', tokenHandler(oauthServer));
  router.post('/oauth/authenticate', authenticateHandler(oauthServer));
  router.get('/login', (req, res) => {
    res.render('login', {
      redirect: req.query.redirect,
      client_id: req.query.client_id,
      redirect_uri: req.query.redirect_uri,
      state: req.query.state,
      response_type: req.query.response_type,
      grant_type: req.query.grant_type
    });
  });
  router.post('/login', async (req, res) => {
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
  });
  router.get('/oauth/authorize', (req, res) => {
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
  });
  router.post('/oauth/authorize', authorizeHandler(oauthServer));
  router.get('/public', (req, res) => {
    res.send('Public Area');
  });
  return router;
};

// Get secret.
// app.get('/secret', app.oauth.authenticate(), function(req, res) {
//   // Will require a valid access_token.
//   res.send('Secret area');
// });
