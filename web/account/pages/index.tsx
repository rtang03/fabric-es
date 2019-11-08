import React from 'react';
import Layout from '../components/Layout';
import { useUsersQuery } from '../generated/graphql';

export default () => {
  const { data } = useUsersQuery({ fetchPolicy: 'network-only' });

  if (!data) {
    return (
      <Layout>
        <div>loading...</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div>
        <div>users:</div>
        <ul>
          {data.users.map(x => {
            return (
              <li key={x.id}>
                {x.email}, {x.id}
              </li>
            );
          })}
        </ul>
      </div>
    </Layout>
  );
};
