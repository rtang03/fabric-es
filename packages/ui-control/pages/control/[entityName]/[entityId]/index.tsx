import { GetServerSideProps, InferGetServerSidePropsType, NextPage } from 'next';
import React from 'react';
import Layout from '../../../../components/Layout';
import { getServerSideUser } from '../../../../utils';

const EntityPage: NextPage<InferGetServerSidePropsType<typeof getServerSideProps>> = ({ accessToken }) => {
  return (
    <Layout title="Dashboard" user={null} restrictedArea={false}>
      d
    </Layout>
  );
};

export const getServerSideProps: GetServerSideProps<{ accessToken: string }> = getServerSideUser();

export default EntityPage;
