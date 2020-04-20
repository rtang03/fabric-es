import util from 'util';
import express from 'express';
import httpStatus from 'http-status';
import passport from 'passport';
import { AccessToken } from '../entity/AccessToken';
import { User } from '../entity/User';
import { generateToken, getLogger } from '../utils';

const logger = getLogger({ name: '[auth] createIndexRoute.js' });

export const createIndexRoute: (option: {
  jwtSecret: string;
  expiryInSeconds: number;
  orgAdminSecret?: string;
}) => express.Router = ({ jwtSecret, expiryInSeconds, orgAdminSecret }) => {
  const router = express.Router();

  router.get('/', (_, res) => {
    res.status(httpStatus.OK).send({ data: 'Hello' });
  });

  router.post('/login', (req, res) => {
    passport.authenticate('local', { session: false, failureRedirect: '/login' }, async (error, user: User) => {
      if (error || !user) return res.status(httpStatus.BAD_REQUEST).json({ error });

      const access_token = generateToken({
        user_id: user.id,
        is_admin: user.is_admin,
        secret: jwtSecret,
        expiryInSeconds
      });

      return AccessToken.insert(
        AccessToken.create({ access_token, user_id: user.id, expires_at: Date.now() + expiryInSeconds * 1000 })
      )
        .then(() => {
          res.cookie('token', access_token, { httpOnly: true, secure: true });
          res.status(httpStatus.OK).send({ username: user.username, id: user.id, access_token, token_type: 'Bearer' });
        })
        .catch(e => {
          logger.error(util.format('fail insert access token, %j', e));
          res.status(httpStatus.BAD_REQUEST).send({ error: 'failed to create access token' });
        });
    })(req, res);
  });

  router.get('/logout', (req, res) => {
    req.logout();
    res.redirect('/');
  });

  return router;
};
