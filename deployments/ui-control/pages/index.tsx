import Typography from '@material-ui/core/Typography';
import Layout from 'components/Layout';
import { NextPage } from 'next';
import React from 'react';

const Index: NextPage<any> = () => {
  return (
    <Layout title="Home">
      <Typography variant="h6">Control Panel</Typography>
      <p>Steps to test the functionality:</p>

      <ol>
        <li>Click register and create an account, this will also log you in.</li>
        <li>
          Click home and click profile again, notice how your session is being used through a token
          stored.
        </li>
        <li>
          Click logout and try to go to profile again. You'll get redirected to the `/login` route.
        </li>
      </ol>
      <style jsx>{`
        li {
          margin-bottom: 0.5rem;
        }
      `}</style>
    </Layout>
  );
};

export default Index;
