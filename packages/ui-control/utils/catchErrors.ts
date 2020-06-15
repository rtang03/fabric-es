import util from 'util';
import { ApolloError } from '@apollo/client/core';
import { ApolloContext } from '../types';
import { isRegisterResponse } from './typeGuard';

export const catchErrors: <TResponse extends any>(
  fetchFunction: (variables: any) => Promise<any>,
  option: { fcnName: string; useAuth: boolean; typeGuard?: (input: any) => boolean }
) => (root: any, variables: any, context: ApolloContext) => Promise<TResponse | ApolloError> = (
  fetchFunction,
  { fcnName, useAuth, typeGuard }
) => async (root, variables, context) => {
  let response;

  try {
    response = await fetchFunction(variables);
  } catch (e) {
    console.error(util.format('%s: fail to fetch, %j', fcnName, e));
    return new ApolloError(e);
  }

  if (response.status !== 200) {
    const errorMessage = await response.text();
    console.error(`fail to fetch: status-code: ${response.status}`);
    return new ApolloError({ errorMessage });
  }

  try {
    const result = await response.json();

    if (typeGuard)
      return typeGuard(result)
        ? result
        : new ApolloError({ errorMessage: 'unexpected response format' });

    return result;
  } catch (e) {
    console.error(util.format('%s: fail to parse json, %j', fcnName, e));
    return new ApolloError(e);
  }
};
