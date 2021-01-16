import { ApolloClient, InMemoryCache, HttpLink, ApolloLink, Operation } from '@apollo/client';
import { setContext } from '@apollo/link-context';
import { SchemaLink } from '@apollo/link-schema';
import { useMemo } from 'react';
import { schema } from '../server/schema';
import { tokenStore } from './tokenStore';

let apolloClient: ApolloClient<any>;

// add authorization headers for each ApolloLink
const authLink = () =>
  setContext((_, { headers }) => ({
    headers: { ...headers, authorization: `Bearer ${tokenStore.getToken()}` },
  }));

// fetching link for bbf (aka. BackendForFrontend}
const bbfLink = new HttpLink({
  uri: '/control/api/graphql',
  credentials: 'same-origin',
});

// TODO: Less preferred. The browser client will access the queryHandler, outside nginx
// Alternate implementation is to create new BBF api, to route request from BBF, to INTERNAL QueryHandler
// Also, process.env.QH_EXTERNAL_HOST will be available to browser, via .env.local

const queryHandlerLink = new HttpLink({
  uri: process.env.NEXT_PUBLIC_QH_EXTERNAL_HOST || process.env.QH_EXTERNAL_HOST || 'http://localhost:5001/graphql',
});

const gatewayLink = new HttpLink({
  uri: process.env.NEXT_PUBLIC_GW_ORG_EXTERNAL_HOST || process.env.GW_ORG_EXTERNAL_HOST || 'http://localhost:4001/graphql',
});

const condition = (dest: string) => ({ getContext }: Operation) => getContext().backend === dest;

// https://www.loudnoises.us/next-js-two-apollo-clients-two-graphql-data-sources-the-easy-way/
const createIsomorphLink = () =>
  typeof window === 'undefined'
    ? ApolloLink.split(
        condition('queryHandler'),
        queryHandlerLink,
        ApolloLink.split(condition('gateway'), gatewayLink, new SchemaLink({ schema }))
      )
    : ApolloLink.split(
        condition('queryHandler'),
        queryHandlerLink,
        ApolloLink.split(condition('gateway'), gatewayLink, bbfLink)
      );

const createClient = () =>
  new ApolloClient({
    ssrMode: typeof window === 'undefined',
    credentials: 'include',
    link: authLink().concat(createIsomorphLink()),
    cache: new InMemoryCache(),
  });

export const initializeApollo = (initialState = null) => {
  const _apolloClient = apolloClient ?? createClient();

  // If your page has Next.js data fetching methods that use Apollo Client, the initial state
  // gets hydrated here
  initialState && _apolloClient.cache.restore(initialState);

  // For SSG and SSR always create a new Apollo Client
  if (typeof window === 'undefined') return _apolloClient;
  // Create the Apollo Client once in the client
  !apolloClient && (apolloClient = _apolloClient);

  return _apolloClient;
};

export const useApollo = (initialState: any) =>
  useMemo(() => initializeApollo(initialState), [initialState]);
