import Layout from 'components/Layout';
import withAuthAsync from 'components/withAuth';
import { useMeQuery } from 'graphql/generated';
import { NextPage } from 'next';
import Router from 'next/router';
import React, { useEffect } from 'react';

const Index: NextPage<any> = () => {
  const { data, error, loading } = useMeQuery();

  useEffect(() => {
    if (!loading && error) setTimeout(async () => Router.push('/'), 3000);
  });

  return data?.me ? (
    <Layout title="Home" loading={false} user={data?.me} restricted={true}>
      Welcome! {data?.me?.username}
    </Layout>
  ) : (
    <Layout title="Home" loading={loading} user={null} restricted={false}>
      {error?.message}
    </Layout>
  );
};

export default withAuthAsync(Index);
