/**
 * @see https://jolvera.dev/posts/user-authentication-with-nextjs
 * BUG: Below HOC does not work. Trouble shoot later.
 */

import cookie from 'cookie';
import httpStatus from 'http-status';
import { NextPage, NextPageContext } from 'next';
import Router from 'next/router';
import React from 'react';

// Gets the display name of a JSX component for dev tools
const getDisplayName = (Component: any) => Component.displayName || Component.name || 'Component';

export const withAuthSync = (WrappedComponent: NextPage) =>
  class extends React.Component {
    static displayName = `withAuthSync(${getDisplayName(WrappedComponent)})`;

    static async getInitialProps(ctx: NextPageContext) {
      const protocol = process.env.NODE_ENV === 'production' ? 'http' : 'http';
      const { req, res } = ctx;

      let user;

      if (typeof window === 'undefined') {
        const cookies = cookie.parse(req?.headers.cookie ?? '');
        const token = cookies.jid;

        if (!token) {
          res?.writeHead(httpStatus.NOT_FOUND, { Location: '/web/login' });
          res?.end();
        }

        try {
          const response = await fetch(`${protocol}://${req?.headers.host}/web/api/profile`, {
            headers: { cookie: `jid=${token}` }
          });
          if (response.status === httpStatus.UNAUTHORIZED)
            user = {};
          if (response.status === httpStatus.OK) {
            user = await response.json();
          }
        } catch (e) {
          console.error(e);
        }
      } else {
        const response = await fetch(`${protocol}://${window.location.host}/web/api/profile`);

        if (response.status === httpStatus.UNAUTHORIZED) {
          await Router.push('/web/login');
        }

        if (response.status !== httpStatus.OK) throw new Error(await response.text());
        user = await response.json();
      }

      const componentProps = WrappedComponent.getInitialProps && (await WrappedComponent.getInitialProps(ctx));

      return { ...componentProps, user };
    }

    render() {
      return <WrappedComponent {...this.props} />;
    }
  };
