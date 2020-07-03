import { gql } from '@apollo/client/core';
import { makeExecutableSchema } from 'graphql-tools';
import fetch from 'isomorphic-unfetch';
import { ApolloContext, LoginResponse, RegisterResponse, User } from '../types';
import { catchErrors, isLoginResponse, isRegisterResponse } from '../utils';

export const resolvers = {
  Query: {
    ping: async () => 'pong',
    me: catchErrors<User>(
      (_: any, { authUri, token }) =>
        fetch(`${authUri}/account/userinfo`, {
          headers: {
            'Access-Control-Allow-Origin': '*',
            authorization: `bearer ${token}`,
          },
          mode: 'cors',
        }),
      { fcnName: 'me' }
    ),
  },
  Mutation: {
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
        onSuccess: ({ access_token }, { res }) =>
          res.cookie('token', access_token, {
            httpOnly: true,
            secure: false,
            maxAge: 1000 * 60 * 60 * 24 * 31,
            sameSite: true,
          }),
      }
    ),
    logout: (_: any, __: any, { res }: ApolloContext) => {
      res.cookie('token', '', {
        httpOnly: true,
        expires: new Date(0),
      });
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

export const typeDefs = gql`
  type Query {
    ping: String
    me: User!
  }

  type User {
    id: String!
    username: String!
    is_deleted: Boolean!
    is_admin: Boolean!
    password: String!
  }

  type Mutation {
    register(email: String!, password: String!, username: String!): RegisteredUser
    login(password: String!, username: String!): LoggedInUser
    logout: Boolean
    forget(email: String!): Boolean
    reset(password: String!, password2: String!): Boolean
  }

  type RegisteredUser {
    username: String!
    id: String!
  }

  type LoggedInUser {
    username: String!
    id: String!
    access_token: String!
    token_type: String!
  }
`;

export const schema = makeExecutableSchema({ typeDefs, resolvers });
