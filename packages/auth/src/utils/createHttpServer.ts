import cookieParser from 'cookie-parser';
import errorHandler from 'errorhandler';
import express from 'express';
import { Redis } from 'ioredis';
import morgan from 'morgan';
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
    console.log('👉  createConnection - psql');
    await createConnection(connection);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }

  console.log('👉  createTokenRepo - redis');
  const tokenRepo = createTokenRepo({ redis, jwtExpiryInSec });

  console.log('👉  createRefreshTokenRepo - redis');
  const refreshTokenRepo = createRefreshTokenRepo({ redis, refTokenExpiryInSec });

  const app = express();
  app.use(morgan('dev'));
  app.use(express.json());
  app.use(cookieParser());
  app.use(express.urlencoded({ extended: false }));
  app.use(errorHandler());
  app.use(passport.initialize());

  console.log('👉  setupPassport');
  setupPassport({ tokenRepo });

  console.log('👉  createApiKeyRoute');
  app.use('/api_key', createApiKeyRoute());

  console.log('👉  createClientRoute');
  app.use('/client', createClientRoute());
  console.log('👉  createOauthRoute');
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
  console.log('👉  createAccountRoute');
  app.use(
    '/account',
    createAccountRoute({
      orgAdminSecret,
      jwtSecret,
      jwtExpiryInSec,
      tokenRepo,
      refreshTokenRepo,
      refTokenExpiryInSec
    })
  );
  console.log('👉  returning app');
  return app;
};
