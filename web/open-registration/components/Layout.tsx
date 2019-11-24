import Head from 'next/head';
import React from 'react';
import theme from '../utils/theme';
import { Header } from './Header';

const Layout: React.FC<{
  title?: string;
}> = ({ children, title = 'No title' }) => (
  <div>
    <Head>
      <meta charSet="utf-8" />
      <meta
        name="viewport"
        content="minimum-scale=1, initial-scale=1, width=device-width, shrink-to-fit=no"
      />
      {/* PWA primary color */}
      <meta name="theme-color" content={theme.palette.primary.main} />
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css?family=Roboto:300,400,500,700&display=swap"
      />
      <title>{title}</title>
    </Head>
    <Header />
    {children}
  </div>
);

export default Layout;
