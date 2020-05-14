import { NextPage } from 'next';
import React from 'react';
import Layout from '../../components/Layout';
import { User } from '../../server/types';
import { fetchBFF } from '../../utils';

const Index: NextPage<User> = user => (
  <Layout title="Home" user={user}>
    <div>Registration Client</div>
  </Layout>
);

Index.getInitialProps = async ctx => {
  return fetchBFF<User>(ctx, 'profile');
};

export default Index;
