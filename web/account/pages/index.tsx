import React from 'react';
import Layout from '../components/Layout';
import { useUsersQuery } from '../generated/graphql';

export default () => {
  const { data } = useUsersQuery({ fetchPolicy: 'network-only' });

  if (!data) {
    return (
      <Layout title="Home">
        <div>loading...</div>
      </Layout>
    );
  }

  return (
    <Layout title="Home">
      <div>
        <div>List of users:</div>
        <ul>
          {data.users.map(({ id, email }) => {
            return (
              <li key={id}>
                {email}, {id}
              </li>
            );
          })}
        </ul>
      </div>
    </Layout>
  );
};
