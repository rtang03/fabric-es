import Typography from '@material-ui/core/Typography';
import { NextPage } from 'next';
import React from 'react';
import Layout from '../../components/Layout';
import { User } from '../../server/types';
import { fetchResult, getBackendApi } from '../../utils';

const WalletPage: NextPage<{ user: User; wallet: any }> = ({ user, wallet }) => {
  return (
    <Layout title="Wallet" user={user}>
      <Typography variant="h6">Digital Wallet</Typography>
      {JSON.stringify(wallet, null, 2)}
    </Layout>
  );
};

WalletPage.getInitialProps = async ctx => {
  const user = await fetchResult<User>(ctx, 'profile');
  const wallet = await fetchResult<any>(ctx, 'wallet');
  const apiUrl = getBackendApi(ctx, 'wallet');
  return { user, wallet };
};

export default WalletPage;
