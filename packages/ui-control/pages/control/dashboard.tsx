import { NextPage } from 'next';
import Router from 'next/router';
import React, { useEffect } from 'react';
import { useDispatchAlert, useDispatchAuth } from '../../components';
import Layout from '../../components/Layout';
import { useMeQuery } from '../../graphql/generated';

const ERROR = 'Fail to authenticate';

const Dashboard: NextPage<any> = () => {
  const dispatchAlert = useDispatchAlert();
  const dispatchAuth = useDispatchAuth();
  const { data, loading, error } = useMeQuery();

  if (!loading && data?.me) dispatchAuth({ type: 'LOGIN_SUCCESS', payload: { user: data.me } });

  useEffect(() => {
    if (error) {
      setTimeout(() => {
        dispatchAlert({ type: 'ERROR', message: ERROR });
      }, 100);
      setTimeout(async () => Router.push(`/control`), 3000);
    }
  }, [error]);

  return (
    <Layout title="Dashboard" loading={loading} user={data?.me}>
      {error ? <>Error when authenticating user</> : <>Data Loading</>}
    </Layout>
  );
};

export default Dashboard;
