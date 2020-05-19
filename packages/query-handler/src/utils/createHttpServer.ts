import bodyParser from 'body-parser';
import express, { Express } from 'express';
import { queryByEntityName } from '../graphql/query';
import { QueryDatabase } from '../types';

export const createHttpServer: (database: QueryDatabase) => Express = database => {
  const app = express();

  app.use(bodyParser.json());

  app.use('/query_handler', queryByEntityName(database));

  return app;
};
