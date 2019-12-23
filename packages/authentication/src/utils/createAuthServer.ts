import { Express } from 'express';
import { AccessToken } from '../entity/AccessToken';
import { AuthorizationCode } from '../entity/AuthorizationCode';
import { Client } from '../entity/Client';
import { OUser } from '../entity/OUser';
import { RefreshToken } from '../entity/RefreshToken';
import { ClientResolver, OUserResolver } from '../resolvers';
import { createHttpServer } from './index';

export const createDbConnection = (connectionOptions: any) => ({
  ...connectionOptions,
  entities: [OUser, Client, AccessToken, AuthorizationCode, RefreshToken]
});

export const createAuthServer: (option: {
  dbConnection: any;
  oauthOptions?: any;
}) => Promise<Express> = ({
  dbConnection,
  oauthOptions = {
    requireClientAuthentication: {
      password: false,
      refreshToken: false,
      authorization_code: true
    },
    accessTokenLifetime: 300,
    refreshTokenLifetime: 1500
  }
}) =>
  createHttpServer({
    dbConnection,
    resolvers: [ClientResolver, OUserResolver],
    oauthOptions
  });