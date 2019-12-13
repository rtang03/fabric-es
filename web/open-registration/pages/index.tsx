import Typography from '@material-ui/core/Typography';
import { NextPage } from 'next';
import React from 'react';
import Layout from '../components/Layout';
import ProTip from '../components/ProTip';

const Index: NextPage = () => {
  return (
    <Layout title="Home">
      <div>
        <Typography component="h1" variant="h5">
          Open Registration Client
        </Typography>
        <ProTip />
      </div>
    </Layout>
  );
};

export default Index;
