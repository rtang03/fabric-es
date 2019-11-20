import React from 'react';
import Layout from '../components/Layout';

export default () => {

  return (
    <Layout title="Home">
      <div>
        <div>Login with Authorization Server</div>
        <a href="http://localhost:4000/oauth/authorize?client_id=7f81c67b-062c-4b36-86a3-976d51eabafe&redirect_uri=http://localhost:3000/callback&grant_type=authorization_code&response_type=code&state=999">Log In</a>
      </div>
    </Layout>
  );
};
