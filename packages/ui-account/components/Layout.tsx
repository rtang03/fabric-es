import Head from 'next/head';
import Link from 'next/link';
import Router from 'next/router';
import React, { Fragment } from 'react';
import { User } from '../server/types';

const logout = async () => {
  const protocol = process.env.NODE_ENV === 'production' ? 'http' : 'http';
  if (typeof window !== 'undefined') {
    await fetch(`${protocol}://${window.location.host}/web/api/logout`);
    await Router.push('/web/login');
  }
};

const Layout: React.FC<{
  title?: string;
  user?: User;
  playgroundUrl?: string;
}> = ({ children, title = 'No title', user, playgroundUrl }) => (
  <div>
    <Head>
      <title>{title}</title>
    </Head>
    <style jsx global>{`
      *,
      *::before,
      *::after {
        box-sizing: border-box;
      }
      body {
        margin: 0;
        color: #333;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, Noto Sans,
          sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji';
      }
      .container {
        max-width: 65rem;
        margin: 1.5rem auto;
        padding-left: 1rem;
        padding-right: 1rem;
      }
    `}</style>
    <header>
      <nav>
        <Link href="/">
          <a>Home</a>
        </Link>{' '}
        |{' '}
        {user ? (
          <>
            <Link href="/web/profile">
              <a>Profile</a>
            </Link>{' '}
            |{' '}
            <Link href={'/web/wallet'}>
              <a>Wallet</a>
            </Link>{' '}
            |{' '}
            <Link href={'/web/client'}>
              <a>Client</a>
            </Link>{' '}
            |{' '}
            {playgroundUrl ? (
              <>
                <a href={`${playgroundUrl}`}>Playground</a> |
              </>
            ) : (
              <React.Fragment />
            )}{' '}
            <button onClick={logout}>Logout</button>
          </>
        ) : (
          <>
            <Link href="/web/register">
              <a>Register</a>
            </Link>{' '}
            |{' '}
            <Link href="/web/login">
              <a>Log in</a>
            </Link>
          </>
        )}
      </nav>
      {user ? <p>You are now logged on: {user.username}</p> : <Fragment />}
    </header>
    <hr />
    {children}
  </div>
);

export default Layout;
