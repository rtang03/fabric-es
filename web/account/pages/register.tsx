import Router from 'next/router';
import React, { useState } from 'react';
import Layout from '../components/Layout';
import { useRegisterMutation } from '../generated/graphql';

export default () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [register] = useRegisterMutation();

  return (
    <Layout>
      <form
        onSubmit={async e => {
          e.preventDefault();
          console.log('form submitted');
          const response = await register({
            variables: {
              email,
              password
            }
          });

          console.log(response);

          await Router.push('/');
        }}>
        <div>
          <input
            value={email}
            placeholder='email'
            onChange={e => {
              setEmail(e.target.value);
            }}
          />
        </div>
        <div>
          <input
            type='password'
            value={password}
            placeholder='password'
            onChange={e => {
              setPassword(e.target.value);
            }}
          />
        </div>
        <button type='submit'>register</button>
      </form>
    </Layout>
  );
};
