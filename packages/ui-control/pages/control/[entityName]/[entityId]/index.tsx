import Layout from 'components/Layout';
import withAuthSync from 'components/withAuth';
import { NextPage } from 'next';
import React from 'react';

const EntityPage: NextPage<any> = () => {
  return (
    <Layout title="Dashboard" user={null} restrictedArea={false}>
      d
    </Layout>
  );
};

export default withAuthSync(EntityPage);
