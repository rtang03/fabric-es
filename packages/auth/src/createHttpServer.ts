import cookieParser from 'cookie-parser';
import errorHandler from 'errorhandler';
import express from 'express';
import passport from 'passport';
import { ConnectionOptions, createConnection } from 'typeorm';
import { apiRoute, clientRoute, indexRoute, oauthRoute } from './route';

export const createHttpServer: (option: {
  connection: ConnectionOptions;
}) => Promise<express.Express> = async option => {
  const { connection } = option;

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

  // Passport configuration
  require('./passport');

  app.use('/', indexRoute);
  app.use('/client', clientRoute);
  app.use('/oauth', oauthRoute);
  app.use('/api', apiRoute);

  return app;
};
