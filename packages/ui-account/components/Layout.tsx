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
        <Link href="/web/register">
          <a>Register</a>
        </Link>{' '}
        |{' '}
        <Link href="/web/login">
          <a>Log in</a>
        </Link>{' '}
        |{' '}
      </nav>
    </header>
    <hr />
    {children}
  </div>
);

export default Layout;
