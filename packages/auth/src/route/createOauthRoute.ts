import util from 'util';
import bcrypt from 'bcrypt';
import express from 'express';
import httpStatus from 'http-status';
import { createServer, exchange, grant } from 'oauth2orize';
import passport from 'passport';
import { TokenRepo } from '../entity/AccessToken';
import { ApiKey } from '../entity/ApiKey';
import { AuthorizationCode } from '../entity/AuthorizationCode';
import { Client } from '../entity/Client';
import { RefreshTokenRepo } from '../entity/RefreshToken';
import { User } from '../entity/User';
import { AllowAccessResponse, AuthenticateResponse } from '../types';
import { getLogger, generateToken, isApikey, catchErrors, generateRefreshToken } from '../utils';

/**
 * For original comments
 * @see https://github.com/awais786327/oauth2orize-examples/blob/master/routes/oauth2.js
 */
const logger = getLogger({ name: '[auth] createOauthServer.js' });

export const createOauthRoute: (option: {
  jwtSecret: string;
  jwtExpiryInSec: number;
  tokenRepo: TokenRepo;
  refreshTokenRepo: RefreshTokenRepo;
}) => express.Router = ({
  jwtExpiryInSec,
  jwtSecret,
  tokenRepo,
  refreshTokenRepo,
}) => {
  const server = createServer();
  const router = express.Router();

  server.serializeClient((client: Client, done) => done(null, client.id));
  server.deserializeClient((id, done) =>
    Client.findOne({ where: { id } })
      .then((client) => done(null, client))
      .catch((e) => {
        logger.error(util.format('fail to retrieve client, %j', e));
        return done(e);
      })
  );

  server.grant(
    grant.code(async (client: Client, redirect_uri, user: User, ares, done) => {
      logger.info('register grant type - code');

      const authorization_code = generateToken({
        client,
        user_id: user.id,
        is_admin: user.is_admin,
        secret: jwtSecret,
        jwtExpiryInSec,
      });

      return AuthorizationCode.insert(
        AuthorizationCode.create({
          authorization_code,
          client_id: client.id,
          redirect_uri,
          user_id: user.id,
          username: user.username,
          expires_at: Date.now() + jwtExpiryInSec * 1000,
        })
      )
        .then(() => done(null, authorization_code))
        .catch((e) => {
          logger.error(util.format('fail to insert auth code, %j', e));
          return done(e);
        });
    })
  );

  server.grant(
    grant.token((client: Client, user: User, ares, done) => {
      logger.info('register grant type - token');

      const access_token = generateToken({
        client,
        user_id: user.id,
        is_admin: user.is_admin,
        secret: jwtSecret,
        jwtExpiryInSec,
      });

      return tokenRepo
        .save(user.id, access_token, true)
        .then(() => done(null, access_token))
        .catch((e) => {
          logger.error(util.format('fail to insert access token, %j', e));
          return done(e);
        });
    })
  );

  server.exchange(
    exchange.code(async (client: Client, authorization_code, redirectUri, done) => {
      logger.info('exchange authorization code');

      let authCode: AuthorizationCode;

      try {
        authCode = await AuthorizationCode.findOne({ where: { authorization_code } });
      } catch (e) {
        return done(e);
      }

      if (client.id !== authCode.client_id) return done(null, false);
      if (redirectUri !== authCode.redirect_uri) return done(null, false);

      const access_token = generateToken({
        client,
        user_id: authCode.user_id,
        secret: jwtSecret,
        jwtExpiryInSec,
      });

      return tokenRepo
        .save(authCode.user_id, access_token, true, client.id)
        .then(() => done(null, access_token, null, { username: authCode.username }))
        .catch((e) => {
          logger.error(util.format('fail to insert access token, %j', e));
          return done(e);
        });
    })
  );

  // "password grant type" is similar to "/login"
  // this is invoked via /oauth/token and following oauth2 protocol
  // performing "login" function.
  // "/login" return {username: string, id: string, access_token: string, token_type: 'Bearer'} and "/login" set-cookie
  // "/oauth/token" return { access_token: string, token_type: 'Bearer'} and does not set-cookie
  server.exchange(
    exchange.password(async (client: Client, username, password, scope, done) => {
      logger.info('exchange username/password for token');

      let user: User;
      try {
        user = await User.findOne({ where: { username } });
      } catch (e) {
        logger.error(util.format('fail to retrieve user, %j', e));
        return done(e);
      }

      try {
        const match = await bcrypt.compare(password, user.password);
        if (!match) done(new Error('Incorrect Username / Password'), false);
      } catch (e) {
        logger.error(util.format('fail to compare password, %j', e));
        return done(e);
      }

      const access_token = generateToken({
        client,
        user_id: user.id,
        is_admin: user.is_admin,
        secret: jwtSecret,
        jwtExpiryInSec,
      });

      const refresh_token = generateRefreshToken();
      await refreshTokenRepo.save(user.id, refresh_token, true);

      return tokenRepo
        .save(user.id, access_token, true, client.id)
        .then(() => done(null, access_token, refresh_token))
        .catch((e) => {
          logger.error(util.format('fail to insert access token, %j', e));
          return done(e);
        });
    })
  );

  server.exchange(
    exchange.clientCredentials(async (client: Client, scope, done) => {
      logger.info('exchange clientCredentials for token');

      const api_key = generateToken({
        client,
        secret: jwtSecret,
      });

      try {
        const key = ApiKey.create({ api_key, client_id: client.id, scope });
        await ApiKey.insert(key);
        done(null, key.id, null);
      } catch (e) {
        logger.error(util.format('fail to insert api key, %j', e));
        return done(e);
      }
    })
  );

  server.exchange(
    exchange.refreshToken(async (user: User, oldRefreshToken, scope, done) => {
      const token = await refreshTokenRepo.find(oldRefreshToken);

      if (!token) return done(new Error('refreshToken not exist'), null, null);

      if (token?.user_id !== user.id)
        return done(new Error('token does not belong to you'), null, null);

      const refresh_token = generateRefreshToken();
      const access_token = generateToken({
        user_id: user.id,
        is_admin: user.is_admin,
        secret: jwtSecret,
        jwtExpiryInSec,
      });

      try {
        await refreshTokenRepo.deleteToken(user.id, oldRefreshToken);

        await refreshTokenRepo.save(user.id, refresh_token, true);

        await tokenRepo.save(user.id, access_token, true);
      } catch (e) {
        return done(e, null, null);
      }

      return done(null, access_token, refresh_token);
    })
  );

  // authenticate via basic strategy and client-credential
  router.post('/token', [
    passport.authenticate(['basic', 'oauth2-client-password'], { session: false }),
    server.token(),
    server.errorHandler(),
  ]);

  // authenticated via bearer token
  router.post('/refresh_token', [
    passport.authenticate(['bearer'], { session: false }),
    server.token(),
    server.errorHandler(),
  ]);

  router.post('/authenticate', passport.authenticate('bearer', { session: false }), (req, res) => {
    const { id, is_admin, username } = req.user as User;
    logger.info(`account ${id} is authenticated`);
    const response: AuthenticateResponse = {
      ok: true,
      authenticated: true,
      user_id: id,
      username,
      is_admin,
    };
    return res.status(httpStatus.OK).send(response);
  });

  router.post(
    '/allow_access',
    catchErrors(
      async (req, res) => {
        const { api_key } = req.body;
        const error = 'fail to allow access';

        if (api_key) {
          const key = await ApiKey.findOne({ where: { id: api_key } });

          if (isApikey(key)) {
            const response: AllowAccessResponse = {
              id: key.id,
              allow: true,
              client_id: key.client_id,
              scope: key?.scope,
            };
            return res.status(httpStatus.OK).send(response);
          } else return res.status(httpStatus.UNAUTHORIZED).send({ error });
        } else {
          logger.warn(`${error}: missing api_key`);
          return res.status(httpStatus.UNAUTHORIZED).send({ error: `${error}: missing api_key` });
        }
      },
      { logger, fcnName: 'allow access by api_key' }
    )
  );

  return router;
};
