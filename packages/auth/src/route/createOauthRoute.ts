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
import { User } from '../entity/User';
import { AllowAccessResponse, AuthenticateResponse } from '../types';
import { getLogger, generateToken, isApikey, catchErrors } from '../utils';

/**
 * For original comments
 * @see https://github.com/awais786327/oauth2orize-examples/blob/master/routes/oauth2.js
 */
const logger = getLogger({ name: '[auth] createOauthServer.js' });

export const createOauthRoute: (option: {
  jwtSecret: string;
  expiryInSeconds: number;
  tokenRepo: TokenRepo;
}) => express.Router = ({ expiryInSeconds, jwtSecret, tokenRepo }) => {
  const server = createServer();
  const router = express.Router();

  server.serializeClient((client: Client, done) => done(null, client.id));
  server.deserializeClient((id, done) =>
    Client.findOne({ where: { id } })
      .then(client => done(null, client))
      .catch(e => {
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
        expiryInSeconds
      });

      return AuthorizationCode.insert(
        AuthorizationCode.create({
          authorization_code,
          client_id: client.id,
          redirect_uri,
          user_id: user.id,
          username: user.username,
          expires_at: Date.now() + expiryInSeconds * 1000
        })
      )
        .then(() => done(null, authorization_code))
        .catch(e => {
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
        expiryInSeconds
      });

      return tokenRepo
        .save({
          key: access_token,
          value: {
            access_token,
            client_id: client?.id,
            user_id: user?.id,
            expires_at: Date.now() + expiryInSeconds * 1000
          },
          useDefaultExpiry: true
        })
        .then(() => done(null, access_token))
        .catch(e => {
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
        expiryInSeconds
      });

      return tokenRepo
        .save({
          key: access_token,
          value: {
            access_token,
            client_id: client.id,
            user_id: authCode.user_id,
            expires_at: Date.now() + expiryInSeconds * 1000
          },
          useDefaultExpiry: true
        })
        .then(() => done(null, access_token, null, { username: authCode.username }))
        .catch(e => {
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
        expiryInSeconds
      });

      return tokenRepo
        .save({
          key: access_token,
          value: {
            access_token,
            client_id: client.id,
            user_id: user.id,
            expires_at: Date.now() + expiryInSeconds * 1000
          },
          useDefaultExpiry: true
        })
        .then(() => done(null, access_token))
        .catch(e => {
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
        secret: jwtSecret
      });

      try {
        const key = ApiKey.create({ api_key, client_id: client.id, scope });
        await ApiKey.insert(key);
        done(null, key.id);
      } catch (e) {
        logger.error(util.format('fail to insert api key, %j', e));
        return done(e);
      }
    })
  );

  router.post('/token', [
    passport.authenticate(['basic', 'oauth2-client-password'], { session: false }),
    server.token(),
    server.errorHandler()
  ]);

  router.post('/authenticate', passport.authenticate('bearer', { session: false }), (req, res) => {
    const { id, is_admin, username } = req.user as User;
    logger.info(`account ${id} is authenticated`);
    const response: AuthenticateResponse = {
      ok: true,
      authenticated: true,
      user_id: id,
      username,
      is_admin
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
              scope: key?.scope
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
