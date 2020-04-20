import cookieParser from 'cookie-parser';
import errorHandler from 'errorhandler';
import express from 'express';
import passport from 'passport';
import { ConnectionOptions, createConnection } from 'typeorm';
import { createApiRoute, createClientRoute, createAccountRoute, createIndexRoute, createOauthRoute } from './route';
import { setupPassport } from './utils';

export const createHttpServer: (option: {
  connection: ConnectionOptions;
  jwtSecret: string;
  expiryInSeconds: number;
  orgAdminSecret: string;
}) => Promise<express.Express> = async option => {
  const { connection, jwtSecret, expiryInSeconds, orgAdminSecret } = option;

  try {
    await createConnection(connection);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }

  const app = express();
  app.use(express.json());
  app.use(cookieParser());
  app.use(express.urlencoded({ extended: false }));
  app.use(errorHandler({ dumpExceptions: true, showStack: true }));
  app.use(passport.initialize());
  setupPassport();

  app.use('/', createIndexRoute({ jwtSecret, expiryInSeconds }));
  app.use('/client', createClientRoute());
  app.use('/oauth', createOauthRoute({ jwtSecret, expiryInSeconds }));
  app.use('/api', createApiRoute());
  app.use('/account', createAccountRoute({ orgAdminSecret }));

  return app;
};
