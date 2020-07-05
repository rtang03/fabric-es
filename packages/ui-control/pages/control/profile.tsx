import { GetServerSideProps, InferGetServerSidePropsType, NextPage } from 'next';
import React from 'react';
import Layout from '../../components/Layout';
import { getServerSideUser } from '../../utils';

const Profile: NextPage<InferGetServerSidePropsType<typeof getServerSideProps>> = ({ accessToken }) => {
  return (
    <Layout title="Profile" user={null} restrictedArea={false}>
      d
    </Layout>
  );
};

export const getServerSideProps: GetServerSideProps<{ accessToken: string }> = getServerSideUser();

export default Profile;
