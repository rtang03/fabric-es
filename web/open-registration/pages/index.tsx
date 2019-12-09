import Typography from '@material-ui/core/Typography';
import React from 'react';
import Layout from '../components/Layout';
import ProTip from '../components/ProTip';

export default () => {
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
