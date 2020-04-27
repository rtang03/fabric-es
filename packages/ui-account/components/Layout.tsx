import Head from 'next/head';
import Link from 'next/link';
import Router from 'next/router';
import React from 'react';
import { User } from '../types';

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
}> = ({ children, title = 'No title', user }) => (
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
          <React.Fragment>
            <Link href="/web/profile">
              <a>Profile</a>
            </Link>{' '}
            | <button onClick={logout}>Logout</button>
          </React.Fragment>
        ) : (
          <React.Fragment>
            <Link href="/web/register">
              <a>Register</a>
            </Link>{' '}
            |{' '}
            <Link href="/web/login">
              <a>Log in</a>
            </Link>
          </React.Fragment>
        )}
      </nav>
    </header>
    <hr />
    {children}
  </div>
);

export default Layout;
