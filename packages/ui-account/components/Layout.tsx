import Head from 'next/head';
import Link from 'next/link';
import React from 'react';

const Layout: React.FC<{
  title?: string;
}> = ({ children, title = 'No title' }) => (
  <div>
    <Head>
      <title>{title}</title>
    </Head>
    <header>
      <nav>
        <Link href="/account">
          <a>Home</a>
        </Link>{' '}
        |{' '}
        <Link href="/account/register">
          <a>Register</a>
        </Link>{' '}
        |{' '}
        <Link href="/account/logon">
          <a>Log on</a>
        </Link>{' '}
        |{' '}
        <Link href="/account/logout">
          <a>Log out</a>
        </Link>
      </nav>
    </header>
    <hr />
    {children}
  </div>
);

export default Layout;