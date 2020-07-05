import util from 'util';
// import { ApolloError } from 'apollo-server-express';
import { ApolloError } from '@apollo/client';
import { ApolloContext } from '../types';

export const catchErrors: <TBody = any>(
  fetchFunction: (variables: Record<string, string>, context: ApolloContext) => Promise<any>,
  option: {
    fcnName: string;
    useAuth?: boolean;
    typeGuard?: (input: any) => boolean;
    onSuccess?: (body: TBody, headers: Response['headers'], context: ApolloContext) => any;
    onError?: (error: any, context: ApolloContext) => any;
  }
) => (
  root: null,
  variables: Record<string, string>,
  context: ApolloContext
) => Promise<TBody | ApolloError> = (
  fetchFunction,
  { fcnName, useAuth = false, typeGuard, onSuccess, onError }
) => async (root, variables, context) => {
  let response;

  try {
    response = await fetchFunction(variables, context);
  } catch (e) {
    console.error(util.format('[catchErrors] %s: fail to fetch, %s', fcnName, e.message));
    return new ApolloError({ errorMessage: e.message });
  }

  if (response.status !== 200) {
    const errorMessage = await response.text();
    const statusText = response.statusText;
    console.error(`[catchErrors] fail to fetch: code: ${response.status}, ${errorMessage}`);

    onError?.({ errorMessage, statusText }, context);

    return new ApolloError({ errorMessage });
  }

  try {
    const body = await response.json();

    onSuccess?.(body, response.headers, context);

    if (typeGuard)
      return typeGuard(body)
        ? body
        : new ApolloError({ errorMessage: 'unexpected response format' });

    return body;
  } catch (e) {
    console.error(util.format('[catchErrors] %s: fail to parse json, %j', fcnName, e));
    return new ApolloError({ errorMessage: e.message });
  }
};
