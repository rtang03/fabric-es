import { NextPage } from 'next';
import React from 'react';
import Layout from '../components/Layout';

const Index: NextPage<any> = () => (
  <Layout title="Home">
    <h1>authentication example</h1>

    <p>Steps to test the functionality:</p>

    <ol>
      <li>Click register and create an account, this will also log you in.</li>
      <li>
        Click home and click profile again, notice how your session is being used through a token stored in a cookie.
      </li>
      <li>Click logout and try to go to profile again. You'll get redirected to the `/login` route.</li>
    </ol>
    <style jsx>{`
      li {
        margin-bottom: 0.5rem;
      }
    `}</style>
  </Layout>
);

export default Index;
