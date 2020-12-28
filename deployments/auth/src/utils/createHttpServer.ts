import cookieParser from 'cookie-parser';
import errorHandler from 'errorhandler';
import express from 'express';
import { Redis } from 'ioredis';
import passport from 'passport';
import { ConnectionOptions, createConnection } from 'typeorm';
import {
  createClientRoute,
  createAccountRoute,
  createOauthRoute,
  createApiKeyRoute,
} from '../route';
import { createRefreshTokenRepo, createTokenRepo, setupPassport } from './index';

export const createHttpServer: (option: {
  connection: ConnectionOptions;
  jwtSecret: string;
  jwtExpiryInSec: number;
  refTokenExpiryInSec: number;
  orgAdminSecret: string;
  redis: Redis;
}) => Promise<express.Express> = async (option) => {
  const {
    connection,
    jwtSecret,
    jwtExpiryInSec,
    refTokenExpiryInSec,
    orgAdminSecret,
    redis,
  } = option;

  try {
    await createConnection(connection);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }

  const tokenRepo = createTokenRepo({ redis, jwtExpiryInSec });

  const refreshTokenRepo = createRefreshTokenRepo({ redis, refTokenExpiryInSec });

  const app = express();
  app.use(express.json());
  app.use(cookieParser());
  app.use(express.urlencoded({ extended: false }));
  app.use(errorHandler());
  app.use(passport.initialize());

  setupPassport({ tokenRepo });
  app.get('/oauth/authenticate/ping', (_, res) => res.status(200).send({ data: 'pong' }));
  app.use('/api_key', createApiKeyRoute());

  app.use('/client', createClientRoute());
  app.use(
    '/oauth',
    createOauthRoute({
      jwtSecret,
      jwtExpiryInSec,
      refTokenExpiryInSec,
      tokenRepo,
      refreshTokenRepo,
    })
  );
  app.use(
    '/account',
    createAccountRoute({
      orgAdminSecret,
      jwtSecret,
      jwtExpiryInSec,
      tokenRepo,
      refreshTokenRepo,
      refTokenExpiryInSec,
    })
  );
  return app;
};
