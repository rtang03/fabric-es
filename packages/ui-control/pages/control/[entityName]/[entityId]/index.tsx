import { GetServerSideProps, InferGetServerSidePropsType, NextPage } from 'next';
import React from 'react';
import Layout from '../../../../components/Layout';
import { User } from '../../../../types';
import { getServerSideUser } from '../../../../utils';

const EntityPage: NextPage<InferGetServerSidePropsType<typeof getServerSideProps>> = ({
  user,
  entityName,
  entityId,
}) => {

  return (
    <Layout title="Dashboard" user={user} restrictedArea={true}>
      d
    </Layout>
  );
};

export const getServerSideProps: GetServerSideProps<{
  user: User | null | undefined;
  entityId: string;
  entityName: string;
}> = getServerSideUser();

export default EntityPage;
