import util from 'util';
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
import { getLogger } from './getLogger';

export const createModel: (option?: {
  accessTokenSecret: string;
  accessTokenOptions: any;
  refreshTokenSecret: string;
  refreshTokenOptions: any;
}) => Model = option => {
  const logger = getLogger({ name: 'createModel.js' });

  return {
    request: undefined,
    generateAccessToken: async (client: IClient, user: OUser, scope) => {
      const payload: any = {};
      if (user?.id) payload.userId = user.id;
      if (client?.id) payload.client_id = client.id;
      if (user?.is_admin) payload.is_admin = user.is_admin;
      option.accessTokenOptions.subject = user.id;
      const tok = sign(payload, option.accessTokenSecret, option.accessTokenOptions);
      logger.info(`generateAccessToken for ${user.id}`);

      return tok;
    },
    generateRefreshToken: async (client: IClient, user: OUser, scope) => {
      const payload: any = {};
      if (user?.id) payload.userId = user.id;
      if (client?.id) payload.client_id = client.id;
      option.refreshTokenOptions.subject = client.id;
      const tok = sign(payload, option.refreshTokenSecret, option.refreshTokenOptions);
      logger.info(`generateRefreshToken for ${user.id}`);

      return tok;
    },
    getAccessToken: async (access_token: string) => {
      const token = await AccessToken.findOne({ access_token });
      if (!token) return null;
      const user = await OUser.findOne({ id: token.user_id });
      const client = await Client.findOne({ id: token.client_id });
      logger.debug(`getAccessToken for ${user.id}`);

      return user && client
        ? {
            accessToken: token.access_token,
            accessTokenExpiresAt: token.expires_at,
            client,
            user: { id: user.id, is_admin: user.is_admin, client_id: client.id }
          }
        : null;
    },
    getRefreshToken: async (refresh_token: string) => {
      const token = await RefreshToken.findOne({ refresh_token });
      if (!token) return null;
      const user = await OUser.findOne({ id: token.user_id });
      const client = await Client.findOne({ id: token.client_id });
      logger.info(`getRefreshToken for ${user.id}`);

      return user && client
        ? {
            refreshToken: token.refresh_token,
            refreshTokenExpiresAt: token.expires_at,
            scope: token.scope,
            client,
            user: { id: user.id }
          }
        : null;
    },
    getAuthorizationCode: async (authorization_code: string) => {
      const code = await AuthorizationCode.findOne({ authorization_code });
      if (!code) return null;
      const user = await OUser.findOne({ id: code.user_id });
      const client = await Client.findOne({ id: code.client_id });
      logger.info(`getAuthorizationCode for ${user.id}`);

      return client && user
        ? {
            authorizationCode: code.authorization_code,
            expiresAt: code.expires_at,
            redirectUri: code.redirect_uri,
            scope: code.scope,
            client,
            user: { id: user.id }
          }
        : null;
    },
    getClient: async (client_id: string, client_secret?: string) => {
      const client = client_secret
        ? await Client.findOne({ id: client_id, client_secret }).catch(error => {
            logger.warn(util.format('getClient for %s, %j', client_id, error));
            return null;
          })
        : await Client.findOne({ id: client_id }).catch(error => {
            logger.warn(util.format('getClient for %s, %j', client_id, error));
            return null;
          });
      return client
        ? {
            id: client.id,
            redirectUris: client.redirect_uris,
            grants: client.grants,
            user_id: client.user_id
          }
        : null;
    },
    getUser: async (username: string) => {
      logger.info(`getUser for ${username}`);

      return await OUser.findOne({ username });
    },
    getUserFromClient: async (client: IClient) => {
      logger.info(util.format('getUserFromClient for client %s, user %s', client.id, client.user_id));

      return OUser.findOne({ id: client.user_id });
    },
    revokeAuthorizationCode: async (code: IAuthorizationCode) => {
      await AuthorizationCode.delete({
        authorization_code: code.authorizationCode
      }).catch(error => {
        logger.warn(util.format('revokeAuthorizationCode for client %s, %s', code?.client?.id, error.message));
        return false;
      });
      return true;
    },
    revokeToken: async (token: IRefreshToken) => {
      await RefreshToken.delete({
        refresh_token: token.refreshToken
      }).catch(error => {
        logger.warn(util.format('revokeToken: %s', error.message));
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
      logger.info(util.format('saveAuthorizationCode for client %s, user %s', client.id, user.id));

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
      const exist = await AccessToken.findOne({
        access_token: token.accessToken
      });
      if (exist) {
        await AccessToken.update(
          { access_token: token.accessToken },
          {
            access_token: token.accessToken,
            expires_at: token.accessTokenExpiresAt,
            scope: token.scope,
            client_id: client.id,
            user_id: user.id
          }
        );
        logger.info(`accessToken updated for user ${user.id}`);
      } else {
        await AccessToken.insert({
          access_token: token.accessToken,
          expires_at: token.accessTokenExpiresAt,
          scope: token.scope,
          client_id: client.id,
          user_id: user.id
        });
        logger.info(`accessToken inserted for user ${user.id}`);
      }

      if (token.refreshToken) {
        await RefreshToken.insert({
          refresh_token: token.refreshToken,
          expires_at: token.refreshTokenExpiresAt,
          scope: token.scope,
          client_id: client.id,
          user_id: user.id
        });
        logger.info(`refreshToken inserted for user ${user.id}`);
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
};
