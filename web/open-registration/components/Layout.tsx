import Head from 'next/head';
import React from 'react';
import { Header } from './Header';

const Layout: React.FC<{
  title?: string;
}> = ({ children, title = 'No title' }) => (
  <div>
    <Head>
      <title>{title}</title>
    </Head>
    <Header />
    {children}
  </div>
);

export default Layout;
