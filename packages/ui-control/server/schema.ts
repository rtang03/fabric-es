import cookie from 'cookie';
import { makeExecutableSchema } from 'graphql-tools';
import {
  ApolloContext,
  LoginResponse,
  RefreshTokenResponse,
  RegisterResponse,
  User,
} from '../types';
import { catchErrors, isLoginResponse, isRegisterResponse } from '../utils';
import { typeDefs } from './typeDefs';

export const resolvers = {
  Query: {
    ping: async () => 'pong',
    me: catchErrors<User>(
      (_: any, ctx) => {
        console.log('[schema.tsx] =======me is called==========');

        if (!ctx?.accessToken) return Promise.reject(new Error('No access token'));

        return fetch(`${ctx.authUri}/account/userinfo`, {
          headers: {
            'Access-Control-Allow-Origin': '*',
            authorization: `bearer ${ctx.accessToken}`,
          },
          mode: 'cors',
        });
      },
      { fcnName: 'me' }
    ),
  },
  Mutation: {
    refreshToken: catchErrors<RefreshTokenResponse>(
      (_, { authUri, refreshToken }) => {
        console.log('[schema.tsx] =======refreshToken is called==========', refreshToken);

        if (!refreshToken) return Promise.reject(new Error('No refresh token'));

        return fetch(`${authUri}/oauth/refresh_token`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Access-Control-Allow-Origin': '*',
          },
          body: `refresh_token=${refreshToken}&grant_type=refresh_token`,
          mode: 'cors',
        });
      },
      {
        fcnName: 'refreshToken',
        onSuccess: ({ refresh_token }, headers, { res, refreshToken: oldrt }) => {
          console.log(`[schema.tsx] ==refresh-ok === ${oldrt} is removed`);

          res.append('jwtexpiryinsec', headers.get('jwtexpiryinsec') || '');
          res.append('reftokenexpiryinsec', headers.get('reftokenexpiryinsec') || '');
          res.cookie('rt', refresh_token, {
            httpOnly: true,
            maxAge: 1000 * parseInt(headers.get('reftokenexpiryinsec') || '', 10),
            secure: false,
            sameSite: true,
          });
        },
      }
    ),
    register: catchErrors<RegisterResponse>(
      ({ username, password, email }, { authUri }) =>
        fetch(`${authUri}/account`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
          body: JSON.stringify({ username, password, email }),
          mode: 'cors',
        }),
      {
        fcnName: 'register',
        typeGuard: isRegisterResponse,
      }
    ),
    login: catchErrors<LoginResponse>(
      ({ username, password }, { authUri }) =>
        fetch(`${authUri}/account/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
          body: JSON.stringify({ username, password }),
          mode: 'cors',
        }),
      {
        fcnName: 'login',
        typeGuard: isLoginResponse,
        onSuccess: (_, headers, { res }) => {
          const refreshToken = cookie.parse(headers.get('set-cookie') || '')?.rt;
          res.cookie('rt', refreshToken, {
            httpOnly: true,
            maxAge: 1000 * parseInt(headers.get('reftokenexpiryinsec') || '', 10),
            secure: false,
            sameSite: true,
          });
        },
      }
    ),
    logout: (_: any, __: any, { res }: ApolloContext) => {
      res.cookie('rt', '', { httpOnly: true, maxAge: 0, sameSite: true });
      return true;
    },
    forget: (_: any, { email }: { email: string }) => {
      console.log(email);
      return true;
    },
    reset: (_: any, { password, password2 }: { password: string; password2: string }) => {
      console.log(password, password2);
      return true;
    },
  },
};

export const schema = makeExecutableSchema({ typeDefs, resolvers });
