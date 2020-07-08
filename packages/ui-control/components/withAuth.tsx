import { ApolloProvider } from '@apollo/client';
import cookie from 'cookie';
import { NextPage, NextPageContext } from 'next';
import Router from 'next/router';
import React, { Component, useEffect } from 'react';
import { getToken, saveToken, useApollo } from 'utils';

/**
 * HOC for refreshing token, for children component
 * withAuth will be called in both client and server-side rendering
 */

const getDisplayName = (Component: NextPage) =>
  Component.displayName || Component.name || 'Component';

const auth = async (ctx: NextPageContext) => {
  // Debug
  // console.log('[withAuth.tsx] =======auth is called==========');

  // DEBUG USE: console.log refreshToken
  // import nextCookie from 'next-cookies';
  // const refreshTokenFromCtx = nextCookie(ctx)?.rt;

  const query = `mutation RefreshToken {
    refreshToken {
      access_token
      refresh_token
    }
  }`;

  // TODO: need fix when https is ready later
  const protocol = process.env.NODE_ENV === 'production' ? 'http' : 'http';
  const url =
    typeof window === 'object'
      ? `${protocol}://${window.location.host}/control/api/graphql`
      : `${protocol}://${ctx.req?.headers.host}/control/api/graphql`;
  const headers = ctx?.req ? { Cookie: ctx.req.headers.cookie } : {};

  let response;
  let newRTDetails;

  if (!getToken()) {
    try {
      // fetch BackendForFront (without using apollo client)
      response = await fetch(url, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
          ...(headers as any),
        },
        body: JSON.stringify({
          operationName: 'RefreshToken',
          query,
        }),
      });

      if (response.status !== 200) {
        const text = await response.text();
        console.log('[withAuth] when not 200: ', text);
      }

      if (response.status === 200) {
        const { data, errors } = await response.json();
        const jwtexpiryinsec = parseInt(response.headers.get('jwtexpiryinsec') || '', 10);
        const reftokenexpiryinsec = parseInt(response.headers.get('reftokenexpiryinsec') || '', 10);

        // Debug
        // console.log('[withAuth] when 200: data', data);
        // console.log('[withAuth] when 200: errors', errors);

        // Note: GQL response may return 200, with errors
        if (!data || errors) {
          console.warn('[withAuth.tsx] fetch error:', errors[0].message);
          return { accessToken: null };
        }

        newRTDetails = data?.refreshToken;

        // at server-side, set cookie from BBF to client
        // note: maxAge in cookie.serialize is second; maxAge in Express.response is in ms
        // if maxAge is null, the browser will be set as session cookie; will be misbehave
        newRTDetails &&
          ctx?.res?.setHeader(
            'Set-Cookie',
            cookie.serialize('rt', newRTDetails.refresh_token, {
              httpOnly: true,
              maxAge: reftokenexpiryinsec,
              sameSite: true,
              path: '/control',
            })
          );

        // save token to inMemory
        newRTDetails && saveToken(newRTDetails.access_token, jwtexpiryinsec);

        return { accessToken: newRTDetails.access_token };
      } else return { accessToken: null };
    } catch (e) {
      console.error('[withAuth.tsx]', e);

      // at server-side, forward /login
      if (ctx?.req) ctx.res?.writeHead(302, { Location: '/control/login' }).end();
      // at client-side, forward /login
      else await Router.push('/control/login');
    }
  }

  return { accessToken: getToken() };
};

const withAuth = (WrappedComponent: NextPage<any>) => {
  // Debug
  // console.log('[withAuth.tsx] =======withAuthSync is called==========');

  const AuthComponent = (props: any) => {
    saveToken(props.accessToken);

    // when mount
    useEffect(() => window.addEventListener('storage', syncLogout), []);

    // when unmount
    useEffect(
      () => () => {
        window.removeEventListener('storage', syncLogout);
        window.localStorage.removeItem('logout');
      },
      []
    );

    const apolloClient = useApollo(props?.initialApolloState);

    // IMPORTANT: use different apollo client (with different authorization header)
    return (
      <ApolloProvider client={apolloClient}>
        <WrappedComponent {...props} />
      </ApolloProvider>
    );
  };

  // event handler: when one tab logout, the other tabs will be loggout via localStorage listener
  const syncLogout = (event: any) =>
    event.key === 'logout' && setTimeout(async () => Router.push('/control/login'), 100);

  // display name for Chrome DevTool for React component
  AuthComponent.displayName = `withAuthSync(${getDisplayName(WrappedComponent)})`;

  AuthComponent.getInitialProps = async (ctx: NextPageContext) => {
    // Debug
    // console.log('[withAuth.tsx] =======getIntialProps is called==========');

    // IMPORTANT: every withAuth call will refresh token
    const { accessToken } = await auth(ctx);

    accessToken && saveToken(accessToken);

    const componentProps =
      WrappedComponent.getInitialProps && (await WrappedComponent.getInitialProps(ctx));

    return { ...componentProps, accessToken };
  };

  return AuthComponent;
};

export default withAuth;
