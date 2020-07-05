import Layout from 'components/Layout';
import withAuthAsync from 'components/withAuth';
import { useMeQuery } from 'graphql/generated';
import { NextPage } from 'next';
import Router from 'next/router';
import React, { useEffect } from 'react';
import { getToken } from 'utils';

const Index: NextPage<any> = ({ accessToken }) => {
  const { data, error, loading } = useMeQuery();

  useEffect(() => {
    if (!loading && error) setTimeout(async () => Router.push('/control/login'), 3000);
  });

  if (accessToken !== getToken()) console.error('unexpected error: token mismatch');

  return data?.me ? (
    <Layout title="Home" loading={false} user={data?.me} restrictedArea={true}>
      Welcome! {data?.me?.username}
    </Layout>
  ) : (
    <Layout title="Home" loading={loading} user={null} restrictedArea={false}>
      {error?.message}
    </Layout>
  );
};

export default withAuthAsync(Index);
