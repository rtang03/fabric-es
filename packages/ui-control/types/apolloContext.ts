import { Response } from 'express';

export type ApolloContext = {
  authUri: string;
  res: Response;
  token: string;
};
