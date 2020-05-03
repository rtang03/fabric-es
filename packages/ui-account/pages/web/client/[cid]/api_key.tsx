import Divider from '@material-ui/core/Divider';
import Typography from '@material-ui/core/Typography';
import { NextPage } from 'next';
import React from 'react';
import Layout from '../../../../components/Layout';
import { User } from '../../../../server/types';
import { fetchResult } from '../../../../utils';
import { useRouter } from 'next/router';

const ApiKeyPage: NextPage<{ user: User }> = ({ user }) => {
  const router = useRouter();
  const { cid } = router.query;

  return (
    <Layout title="Client | api key" user={user}>
      <Typography variant="h6">Api key</Typography>
      <Typography variant="h6">Create api key</Typography>
      <Divider />
    </Layout>
  );
};

ApiKeyPage.getInitialProps = async ctx => {
  const user = await fetchResult<User>(ctx, 'profile');
  return { user };
};

export default ApiKeyPage;
