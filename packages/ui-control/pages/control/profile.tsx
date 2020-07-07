import Layout from 'components/Layout';
import withAuth from 'components/withAuth';
import { NextPage } from 'next';
import React from 'react';

const Profile: NextPage<any> = () => {
  return (
    <Layout title="Profile" user={null} restrictedArea={false}>
      d
    </Layout>
  );
};

export default withAuth(Profile);
