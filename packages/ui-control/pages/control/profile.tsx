import Layout from 'components/Layout';
import withAuthSync from 'components/withAuth';
import { NextPage } from 'next';
import React from 'react';

const Profile: NextPage<any> = () => {
  return (
    <Layout title="Profile" user={null} restrictedArea={false}>
      d
    </Layout>
  );
};

export default withAuthSync(Profile);
