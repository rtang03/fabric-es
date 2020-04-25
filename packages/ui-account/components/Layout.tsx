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
        <Link href="/web">
          <a>Home</a>
        </Link>{' '}
        |{' '}
        <Link href="/web/register">
          <a>Register</a>
        </Link>{' '}
        |{' '}
        <Link href="/web/login">
          <a>Log in</a>
        </Link>{' '}
        |{' '}
        {/*<Link href="/web/logout">*/}
        {/*  <a>Log out</a>*/}
        {/*</Link>*/}
      </nav>
    </header>
    <hr />
    {children}
  </div>
);

export default Layout;
