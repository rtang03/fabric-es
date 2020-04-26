import cookieParser from 'cookie-parser';
import errorHandler from 'errorhandler';
import express from 'express';
import { Redis } from 'ioredis';
import morgan from 'morgan';
import passport from 'passport';
import { ConnectionOptions, createConnection } from 'typeorm';
import { createClientRoute, createAccountRoute, createOauthRoute } from '../route';
import { createTokenRepo, setupPassport } from './index';

export const createHttpServer: (option: {
  connection: ConnectionOptions;
  jwtSecret: string;
  expiryInSeconds: number;
  orgAdminSecret: string;
  redis: Redis;
}) => Promise<express.Express> = async option => {
  const { connection, jwtSecret, expiryInSeconds, orgAdminSecret, redis } = option;

  try {
    await createConnection(connection);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
  const tokenRepo = createTokenRepo({ redis, expiryInSeconds });

  const app = express();
  app.use(morgan('tiny'));
  app.use(express.json());
  app.use(cookieParser());
  app.use(express.urlencoded({ extended: false }));
  app.use(errorHandler());
  app.use(passport.initialize());
  setupPassport({ tokenRepo });

  app.use('/client', createClientRoute());
  app.use('/oauth', createOauthRoute({ jwtSecret, expiryInSeconds, tokenRepo }));
  app.use('/account', createAccountRoute({ orgAdminSecret, jwtSecret, expiryInSeconds, tokenRepo }));

  return app;
};
