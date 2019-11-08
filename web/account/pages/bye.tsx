import React from 'react';
import Layout from '../components/Layout';
import { useByeQuery } from '../generated/graphql';

export default () => {
  const { data, loading, error } = useByeQuery();

  if (loading) {
    return (
      <Layout>
        <div>loading...</div>
      </Layout>
    );
  }

  if (error) {
    console.log(error);
    return (
      <Layout>
        <div>err</div>
      </Layout>
    );
  }

  if (!data) {
    return (
      <Layout>
        <div>no data</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div>{data.bye}</div>
    </Layout>
  );
};
