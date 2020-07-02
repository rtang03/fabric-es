import util from 'util';
import { ApolloError } from '@apollo/client';
import { ApolloContext } from '../types';

export const catchErrors: <TResponse = any>(
  fetchFunction: (variables: Record<string, string>, context: ApolloContext) => Promise<any>,
  option: {
    fcnName: string;
    useAuth?: boolean;
    typeGuard?: (input: any) => boolean;
    onSuccess?: (result: TResponse, context: ApolloContext) => any;
    onError?: (error: any, context: ApolloContext) => any;
  }
) => (
  root: null,
  variables: Record<string, string>,
  context: ApolloContext
) => Promise<TResponse | ApolloError> = (
  fetchFunction,
  { fcnName, useAuth = false, typeGuard, onSuccess, onError }
) => async (root, variables, context) => {
  let response;

  try {
    response = await fetchFunction(variables, context);
  } catch (e) {
    console.error(util.format('[catchErrors] %s: fail to fetch, %j', fcnName, e));
    return new ApolloError(e);
  }

  if (response.status !== 200) {
    const errorMessage = await response.text();
    console.error(`[catchErrors] fail to fetch: code: ${response.status}`);

    onError?.(errorMessage, context);

    return new ApolloError({ errorMessage });
  }

  try {
    const result = await response.json();

    onSuccess?.(result, context);

    if (typeGuard)
      return typeGuard(result)
        ? result
        : new ApolloError({ errorMessage: 'unexpected response format' });

    return result;
  } catch (e) {
    console.error(util.format('[catchErrors] %s: fail to parse json, %j', fcnName, e));
    return new ApolloError(e);
  }
};
