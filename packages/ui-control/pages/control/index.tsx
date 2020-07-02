import { GetServerSideProps, InferGetServerSidePropsType, NextPage } from 'next';
import React from 'react';
import Layout from '../../components/Layout';
import { User } from '../../types';
import { getServerSideUser } from '../../utils';

const Index: NextPage<InferGetServerSidePropsType<typeof getServerSideProps>> = ({ user }) => (
  <Layout title="Home" user={user} restrictedArea={true}>
    Welcome! {user?.username}
  </Layout>
);

export const getServerSideProps: GetServerSideProps<{
  user: User | null | undefined;
}> = getServerSideUser();

export default Index;
