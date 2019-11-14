import { sign } from 'jsonwebtoken';
import {
  AuthorizationCode as IAuthorizationCode,
  Client as IClient,
  Model,
  RefreshToken as IRefreshToken,
  Token as IToken
} from 'oauth2-server-typescript';
import { AccessToken } from '../entity/AccessToken';
import { AuthorizationCode } from '../entity/AuthorizationCode';
import { Client } from '../entity/Client';
import { OUser } from '../entity/OUser';
import { RefreshToken } from '../entity/RefreshToken';

export const createModel: (option?: {
  accessTokenSecret: string;
  accessTokenOptions: any;
  refreshTokenSecret: string;
  refreshTokenOptions: any;
  authorizationCode: string;
  authCodeOptions: any;
}) => Model = (
  option = {
    accessTokenSecret: process.env.ACCESS_TOKEN_SECRET!,
    accessTokenOptions: { expiresIn: '15m' },
    refreshTokenSecret: process.env.REFRESH_TOKEN_SECRET!,
    refreshTokenOptions: { expiresIn: '7d' },
    authorizationCode: process.env.AUTHORIZATION_CODE,
    authCodeOptions: { expiresIn: '5m' }
  }
) => ({
  request: undefined,
  generateAccessToken: async (client: IClient, user: OUser, scope) =>
    sign(
      { userId: user.id },
      option.accessTokenSecret,
      option.accessTokenOptions
    ),
  generateRefreshToken: async (client: IClient, user: OUser, scope) =>
    sign(
      { userId: user.id },
      option.refreshTokenSecret,
      option.refreshTokenOptions
    ),
  generateAuthorizationCode: async (client: IClient, user: OUser, scope) =>
    sign({ userId: user.id }, option.authorizationCode, option.authCodeOptions),
  getAccessToken: async (access_token: string) => {
    const token = await AccessToken.findOne({ access_token });
    const user = await OUser.findOne({ id: token.client_id });
    const client = await Client.findOne({ id: token.client_id });
    return {
      accessToken: token.access_token,
      accessTokenExpiresAt: token.expires_at,
      client,
      user: { id: user.id }
    };
  },
  getRefreshToken: async (refresh_token: string) => {
    const token = await RefreshToken.findOne({ refresh_token });
    const user = await OUser.findOne({ id: token.user_id });
    const client = await Client.findOne({ id: token.client_id });
    return {
      refreshToken: token.refresh_token,
      refreshTokenExpiresAt: token.expires_at,
      scope: token.scope,
      client,
      user: { id: user.id }
    };
  },
  getAuthorizationCode: async (authorization_code: string) => {
    const code = await AuthorizationCode.findOne({ authorization_code });
    const user = await OUser.findOne({ id: code.user_id });
    const client = await Client.findOne({ id: code.client_id });
    return {
      authorizationCode: code.authorization_code,
      expiresAt: code.expires_at,
      redirectUri: code.redirect_uri,
      scope: code.scope,
      client,
      user: { id: user.id }
    };
  },
  getClient: async (client_id: string, client_secret?: string) => {
    const client = client_secret
      ? await Client.findOne({ id: client_id, client_secret }).catch(error =>
          console.error(error)
        )
      : await Client.findOne({ id: client_id }).catch(error =>
          console.error(error)
        );
    return client
      ? {
          id: client.id,
          redirectUris: client.redirect_uris,
          grants: client.grants,
          user_id: client.user_id
        }
      : null;
  },
  getUser: async (id: string) => {
    return await OUser.findOne({ id });
  },
  getUserFromClient: async (client: IClient) => {
    return OUser.findOne({ id: client.user_id });
  },
  revokeAuthorizationCode: async (code: IAuthorizationCode) => {
    await AuthorizationCode.delete({
      authorization_code: code.authorizationCode
    }).catch(error => {
      console.error(error);
      return false;
    });
    return true;
  },
  revokeToken: async (token: IRefreshToken) => {
    await RefreshToken.delete({
      refresh_token: token.refreshToken
    }).catch(error => {
      console.error(error);
      return false;
    });
    return true;
  },
  saveAuthorizationCode: async (
    code: IAuthorizationCode,
    client: IClient,
    user: OUser
  ): Promise<IAuthorizationCode> => {
    const authCode = {
      authorization_code: code.authorizationCode,
      expires_at: code.expiresAt,
      redirect_uri: code.redirectUri,
      scope: code.scope || 'default',
      client_id: client.id,
      user_id: user.id
    };
    await AuthorizationCode.insert(authCode);
    return {
      authorizationCode: authCode.authorization_code,
      expiresAt: authCode.expires_at,
      redirectUri: authCode.redirect_uri,
      scope: authCode.scope,
      client,
      user: { id: authCode.user_id }
    };
  },
  saveToken: async (token: IToken, client: IClient, user: OUser) => {
    await AccessToken.insert({
      access_token: token.accessToken,
      expires_at: token.accessTokenExpiresAt,
      scope: token.scope,
      client_id: client.id,
      user_id: user.id
    });

    if (token.refreshToken) {
      await RefreshToken.insert({
        refresh_token: token.refreshToken,
        expires_at: token.refreshTokenExpiresAt,
        scope: token.scope,
        client_id: client.id,
        user_id: user.id
      });
    }
    return {
      accessToken: token.accessToken,
      accessTokenExpiresAt: token.accessTokenExpiresAt,
      refreshToken: token.refreshToken,
      refreshTokenExpiresAt: token.refreshTokenExpiresAt,
      scope: token.scope,
      client,
      user: { id: user.id }
    };
  },
  // validateScope is optional
  verifyScope: async (token: IToken, scope: string) => {
    if (!token.scope) {
      return false;
    }
    const requestedScopes = scope.split(' ');
    const authorizedScopes = token.scope.split(' ');
    return requestedScopes.every(s => authorizedScopes.indexOf(s) >= 0);
  }
});
