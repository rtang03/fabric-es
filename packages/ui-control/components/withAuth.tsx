import { ApolloProvider } from '@apollo/client';
import { NextPage, NextPageContext } from 'next';
import Router from 'next/router';
import React, { Component } from 'react';
import { getToken, saveToken, useApollo } from 'utils';

const getDisplayName = (Component: NextPage) =>
  Component.displayName || Component.name || 'Component';

const auth = async (ctx: NextPageContext) => {
  // const refreshTokenFromCtx = nextCookie(ctx)?.rt;
  const query = `mutation RefreshToken {
    refreshToken {
      access_token
      refresh_token
    }
  }`;
  const protocol = process.env.NODE_ENV === 'production' ? 'http' : 'http';
  const url =
    typeof window === 'object'
      ? `${protocol}://${window.location.host}/control/api/graphql`
      : `${protocol}://${ctx.req?.headers.host}/control/api/graphql`;
  const headers = ctx?.req ? { Cookie: ctx.req.headers.cookie } : {};

  let response;
  let newRefreshTokenDetails;

  if (!getToken()) {
    try {
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

      if (response.status === 200) {
        const { data, errors } = await response.json();

        if (errors) {
          console.warn('[withAuth.tsx] fetch error:', errors[0].message);
          return { accessToken: null };
        }

        newRefreshTokenDetails = data?.refreshToken;

        // at server-side, set cookie when at serversider
        // todo: max-age is not correct, need fix
        ctx?.res?.setHeader(
          'Set-Cookie',
          `rt=${newRefreshTokenDetails.refresh_token};HttpOnly;Max-Age:${86400};Path="/"`
        );

        // TODO: revisit here, add expiry
        saveToken(newRefreshTokenDetails.access_token);
      } else {
        return { accessToken: null };
      }
    } catch (e) {
      console.error('[withAuth.tsx]', e);

      if (ctx?.req) ctx.res?.writeHead(302, { Location: '/control/login' }).end();
      else await Router.push('/control/login');
    }
  }

  return { accessToken: getToken() };
};

const withAuthSync = (WrappedComponent: NextPage) => {
  const AuthComponent = (props: any) => {
    saveToken(props.accessToken);
    const apolloClient = useApollo(props?.initialApolloState);

    return (
      <ApolloProvider client={apolloClient}>
        <WrappedComponent {...props} />
      </ApolloProvider>
    );
  };

  AuthComponent.displayName = `withAuthSync(${getDisplayName(WrappedComponent)})`;

  AuthComponent.getInitialProps = async (ctx: NextPageContext) => {
    const { accessToken } = await auth(ctx);

    saveToken(accessToken);

    const componentProps =
      WrappedComponent.getInitialProps && (await WrappedComponent.getInitialProps(ctx));

    return { ...componentProps, accessToken: getToken() };
  };

  return AuthComponent;
};

export default withAuthSync;
