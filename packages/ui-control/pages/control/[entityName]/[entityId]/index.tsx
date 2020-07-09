import Layout from 'components/Layout';
import withAuth from 'components/withAuth';
import { NextPage } from 'next';
import React from 'react';

const EntityPage: NextPage<any> = () => {
  return (
    <Layout title="Dashboard" user={null} restricted={false}>
      d
    </Layout>
  );
};

export default withAuth(EntityPage);
