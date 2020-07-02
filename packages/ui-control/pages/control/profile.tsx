import { GetServerSideProps, InferGetServerSidePropsType, NextPage } from 'next';
import React from 'react';
import Layout from '../../components/Layout';
import { User } from '../../types';
import { getServerSideUser } from '../../utils';

const Profile: NextPage<InferGetServerSidePropsType<typeof getServerSideProps>> = ({ user }) => {
  return (
    <Layout title="Profile" user={user} restrictedArea={true}>
      d
    </Layout>
  );
};

export const getServerSideProps: GetServerSideProps<{
  user: User | null | undefined;
}> = getServerSideUser();

export default Profile;
