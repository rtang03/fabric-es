import { ApolloClient, InMemoryCache, HttpLink, ApolloLink } from '@apollo/client';
import { SchemaLink } from '@apollo/link-schema';
import { useMemo } from 'react';
import { schema } from '../server/schema';

let apolloClient: ApolloClient<any>;

const homeLink = new HttpLink({
  uri: '/control/api/graphql',
  credentials: 'same-origin',
});

const queryHandlerLink = new HttpLink({
  uri: 'http://queryHandler/graphql',
});

// https://www.loudnoises.us/next-js-two-apollo-clients-two-graphql-data-sources-the-easy-way/
const createIsomorphLink = () => {
  if (typeof window === 'undefined') {
    return ApolloLink.split(
      (operation) => operation.getContext().backend === 'queryHandler',
      queryHandlerLink,
      new SchemaLink({ schema })
    );
  } else {
    return ApolloLink.split(
      (operation) => operation.getContext().backend === 'queryHandler',
      queryHandlerLink,
      homeLink
    );
  }
};

const createClient = () =>
  new ApolloClient({
    ssrMode: typeof window === 'undefined',
    credentials: 'include',
    link: createIsomorphLink(),
    cache: new InMemoryCache(),
  });

export const initializeApollo = (initialState = null) => {
  const _apolloClient = apolloClient ?? createClient();

  // If your page has Next.js data fetching methods that use Apollo Client, the initial state
  // gets hydrated here
  if (initialState) {
    _apolloClient.cache.restore(initialState);
  }
  // For SSG and SSR always create a new Apollo Client
  if (typeof window === 'undefined') return _apolloClient;
  // Create the Apollo Client once in the client
  if (!apolloClient) apolloClient = _apolloClient;

  return _apolloClient;
};

export const useApollo = (initialState: any) => {
  return useMemo(() => initializeApollo(initialState), [initialState]);
};
