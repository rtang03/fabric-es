import util from 'util';
import { ApolloError, gql } from '@apollo/client/core';
import { makeExecutableSchema } from 'graphql-tools';
import fetch from 'isomorphic-unfetch';
import { ApolloContext, RegisterResponse } from '../types';
import { isRegisterResponse } from '../utils';

export const resolvers = {
  Query: {
    me: () => 'Hello',
  },
  Mutation: {
    register: async (
      _: any,
      { username, password, email }: { username: string; password: string; email: string },
      { authUri }: ApolloContext
    ): Promise<RegisterResponse | ApolloError> => {
      let response;

      try {
        response = await fetch(`${authUri}/account`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
          body: JSON.stringify({ username, password, email }),
          mode: 'cors',
        });
      } catch (e) {
        console.error(util.format('fail to fetch, %j', e));
        return new ApolloError(e);
      }

      if (response.status !== 200) {
        const errorMessage = await response.text();
        console.error(`fail to fetch: status-code: ${response.status}`);
        return new ApolloError({ errorMessage });
      }

      try {
        const result: unknown = await response.json();
        return isRegisterResponse(result)
          ? result
          : new ApolloError({ errorMessage: 'unexpected response format' });
      } catch (e) {
        console.error(util.format('fail to parse json, %j', e));
        return new ApolloError(e);
      }
    },
    login: async (
      _: any,
      { username, password }: { username: string; password: string },
      { authUri, res }: ApolloContext
    ) => {
      const response = await fetch(`${authUri}/account/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({ username, password }),
        mode: 'cors',
      });

      const result = await response.json();

      res.cookie('token', null, {
        httpOnly: true,
        secure: false,
        maxAge: 1000 * 60 * 60 * 24 * 31,
      });
      res.status(200).send({ data: 'ok' });

      return result;
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
    me: String
  }

  type Mutation {
    register(email: String!, password: String!, username: String!): RegisteredUser
    login(password: String!, username: String!): Boolean
    forget(email: String!): Boolean
    reset(password: String!, password2: String!): Boolean
  }

  type RegisteredUser {
    username: String!
    id: String!
  }
`;

export const schema = makeExecutableSchema({ typeDefs, resolvers });
