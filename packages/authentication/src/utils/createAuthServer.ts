import { Express } from 'express';
import { ConnectionOptions } from 'typeorm';
import { AccessToken } from '../entity/AccessToken';
import { AuthorizationCode } from '../entity/AuthorizationCode';
import { Client } from '../entity/Client';
import { OUser } from '../entity/OUser';
import { RefreshToken } from '../entity/RefreshToken';
import { ClientResolver, OUserResolver } from '../resolvers';
import { createHttpServer } from './index';

export const createDbConnection = (
  connectionOptions: any
): ConnectionOptions => ({
  ...connectionOptions,
  entities: [OUser, Client, AccessToken, AuthorizationCode, RefreshToken]
});

export const createAuthServer: (option: {
  dbConnection: ConnectionOptions;
  oauthOptions?: any;
  rootAdmin: string;
  rootAdminPassword: string;
  accessTokenSecret?: string;
  refreshTokenSecret?: string;
}) => Promise<Express> = ({
  dbConnection,
  oauthOptions = {
    requireClientAuthentication: {
      password: false,
      refreshToken: false,
      authorization_code: true
    },
    accessTokenLifetime: 900,
    refreshTokenLifetime: 1800
  },
  rootAdmin,
  rootAdminPassword,
  accessTokenSecret,
  refreshTokenSecret
}) =>
  createHttpServer({
    dbConnection,
    resolvers: [ClientResolver, OUserResolver],
    oauthOptions,
    rootAdmin,
    rootAdminPassword,
    modelOptions: {
      accessTokenSecret,
      refreshTokenSecret
    }
  });
