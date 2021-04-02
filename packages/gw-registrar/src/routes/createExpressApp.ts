import express from 'express';
import { createDidRoute } from './createDidRoute';

const config = require('../public/did-configuration.json');

export const createExpressApp: (url: string) => express.Express = (url) => {
  const app = express();

  app.use(express.json());

  // https://identity.foundation/.well-known/resources/did-configuration/
  app.get('/.well-known/did-configuration', (_, res) => res.send(config));

  app.use('/did', createDidRoute(url));

  return app;
};
