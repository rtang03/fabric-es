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
import { createAccessToken, createRefreshToken } from './auth';

export const model: Model = {
  request: undefined,
  generateAccessToken: async (client: IClient, user: OUser, scope) =>
    createAccessToken(user),
  generateRefreshToken: async (client: IClient, user: OUser, scope) =>
    createRefreshToken(user),
  getAccessToken: async (access_token: string) => {
    const token = await AccessToken.findOne({ access_token });
    const user = await OUser.findOne({ id: token.client_id });
    const client = await Client.findOne({ id: token.client_id });
    return {
      accessToken: token.access_token,
      accessTokenExpiresAt: token.expires_at,
      client,
      user
    };
  },
  getRefreshToken: async (refresh_token: string) => {
    const token = await RefreshToken.findOne({ refresh_token });
    const user = await OUser.findOne({ id: token.client_id });
    const client = await Client.findOne({ id: token.client_id });
    return {
      refreshToken: token.refresh_token,
      refreshTokenExpiresAt: token.expires_at,
      scope: token.scope,
      client,
      user
    };
  },
  getAuthorizationCode: async (authorization_code: string) => {
    const code = await AuthorizationCode.findOne({ authorization_code });
    const user = await OUser.findOne({ id: code.client_id });
    const client = await Client.findOne({ id: code.client_id });
    return {
      authorizationCode: code.authorization_code,
      expiresAt: code.expires_at,
      redirectUri: code.redirect_uri,
      scope: code.scope,
      client,
      user
    };
  },
  getClient: async (client_id: string, client_secret?: string) => {
    const client = client_secret
      ? await Client.findOne({ client_id, client_secret }).catch(error =>
          console.error(error)
        )
      : await Client.findOne({ client_id }).catch(error =>
          console.error(error)
        );
    return client
      ? {
          id: client.id,
          redirectUris: client.redirect_uris,
          grants: client.grants
        }
      : null;
  },
  getUser: async (username: string, password: string) => {
    // todo: check against the passsword salt
    // todo: check against Fabric CA identity
    return await OUser.findOne({ username });
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
    await RefreshToken.delete({ refresh_token: token.refreshToken }).catch(
      error => {
        console.error(error);
        return false;
      }
    );
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
      scope: code.scope,
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
      user
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
};
