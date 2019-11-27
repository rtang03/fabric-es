import { InMemoryCache, NormalizedCacheObject } from 'apollo-cache-inmemory';
import { ApolloClient } from 'apollo-client';
import { ApolloLink } from 'apollo-link';
import { setContext } from 'apollo-link-context';
import { onError } from 'apollo-link-error';
import { HttpLink } from 'apollo-link-http';
import fetch from 'isomorphic-unfetch';
import Head from 'next/head';
import React from 'react';
const isServer = () => typeof window === 'undefined';
let accessToken = '';
export const getAccessToken = () => accessToken;
export const setAccessToken = (token: string) => accessToken = token;

export function withApollo(PageComponent: any, { ssr = true } = {}) {
  const WithApollo = ({
    apolloClient: client,
    apolloState,
    ...pageProps
  }: any) => (
    <PageComponent
      {...pageProps}
      apolloClient={client || initApolloClient(apolloState)}
    />
  );

  if (process.env.NODE_ENV !== 'production') {
    // Find correct display name
    const displayName =
      PageComponent.displayName || PageComponent.name || 'Component';

    // Warn if old way of installing apollo is used
    if (displayName === 'App') {
      console.warn('This withApollo HOC only works with PageComponents.');
    }

    // Set correct display name for devtools
    WithApollo.displayName = `withApollo(${displayName})`;
  }

  if (ssr || PageComponent.getInitialProps) {
    WithApollo.getInitialProps = async (ctx: any) => {
      const {
        AppTree,
        ctx: { req, res }
      } = ctx;

      if (isServer()) {
        const cookie = await import('cookie');
        const cookies = cookie.parse(req.headers.cookie || '');
        if (cookies.jid) setAccessToken(cookies.jid);
      } else {
        const jscookie =  await import('js-cookie');
        const token = jscookie.get().jid;
        if (token) setAccessToken(token);
      }

      // Run all GraphQL queries in the component tree
      // and extract the resulting data
      const apolloClient = (ctx.ctx.apolloClient = initApolloClient(
        {},
        getAccessToken()
      ));

      const pageProps = PageComponent.getInitialProps
        ? await PageComponent.getInitialProps(ctx)
        : {};

      // Only on the server
      if (isServer()) {
        // When redirecting, the response is finished.
        // No point in continuing to render
        if (res && res.finished) {
          return {};
        }

        if (ssr) {
          try {
            // Run all GraphQL queries
            const { getDataFromTree } = await import('@apollo/react-ssr');
            await getDataFromTree(
              <AppTree
                pageProps={{
                  ...pageProps,
                  apolloClient
                }}
                apolloClient={apolloClient}
              />
            );
          } catch (error) {
            // Prevent Apollo Client GraphQL errors from crashing SSR.
            // Handle them in components via the data.error prop:
            // https://www.apollographql.com/docs/react/api/react-apollo.html#graphql-query-data-error
            console.error('Error while running `getDataFromTree`', error);
          }
        }

        // getDataFromTree does not call componentWillUnmount
        // head side effect therefore need to be cleared manually
        Head.rewind();
      }

      // Extract query data from the Apollo store
      const apolloState = apolloClient.cache.extract();

      return {
        ...pageProps,
        apolloState,
      };
    };
  }
  return WithApollo;
}

let apolloClient: ApolloClient<NormalizedCacheObject> | null = null;

/**
 * Always creates a new apollo client on the server
 * Creates or reuses apollo client in the browser.
 */
function initApolloClient(initState: any, token?: string) {
  // Make sure to create a new client for every server-side request so that data
  // isn't shared between connections (which would be bad)
  if (isServer()) return createApolloClient(initState, token);

  // Reuse client on the client-side
  if (!apolloClient) apolloClient = createApolloClient(initState);
  return apolloClient;
}

function createApolloClient(initialState = {}, serverAccessToken?: string) {
  const httpLink = new HttpLink({
    uri: process.env.API_GATEWAY_URI || 'http://localhost:4000/graphql',
    credentials: 'include',
    fetch
  });

  const authLink = setContext((request, { headers }) => {
    const token = serverAccessToken || getAccessToken();
    return {
      headers: {
        ...headers,
        authorization: token ? `bearer ${token}` : ''
      }
    };
  });

  const errorLink = onError(({ graphQLErrors, networkError }) => {
    if (graphQLErrors) {
      if (graphQLErrors[0].message !== 'could not find user')
        console.info(graphQLErrors);
    }
    if (networkError) console.error(networkError);
  });

  return new ApolloClient({
    ssrMode: isServer(), // Disables forceFetch on the server (so queries are only run once)
    link: ApolloLink.from([authLink, errorLink, httpLink]),
    cache: new InMemoryCache().restore(initialState),
    connectToDevTools: true
  });
}
