import express from 'express';
import { OAuth2Server } from 'oauth2-server-typescript/lib/server';
import {
  authenticateHandler,
  authorizeGetHandler,
  authorizePostHandler,
  loginGetHandler,
  loginPostHandler,
  tokenHandler
} from '../middleware';

export const indexRouter = (oauthServer: OAuth2Server, options?: any) => {
  const router = express.Router();
  router.get('/', (_, res) => {
    res.render('index', { title: 'Authorization' });
  });
  router.post('/oauth/token', tokenHandler(oauthServer, options));
  router.post('/oauth/refresh_token', tokenHandler(oauthServer, options));
  router.post('/oauth/authenticate', authenticateHandler(oauthServer));
  router.post('/oauth/authorize', authorizeGetHandler(oauthServer));
  router.get('/login', loginGetHandler);
  router.post('/login', loginPostHandler);
  router.get('/oauth/authorize', authorizePostHandler);
  return router;
};