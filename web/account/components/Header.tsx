import Link from 'next/link';
import React from 'react';
import { useLogoutMutation, useMeQuery } from '../generated/graphql';
import { setAccessToken } from '../utils/accessToken';

export const Header: React.FC<any> = () => {
  const { data, loading } = useMeQuery();
  const [logout, { client }] = useLogoutMutation();

  let body: any = null;

  if (loading) {
    body = null;
  } else if (data && data.me) {
    body = <div>you are logged in as: {data.me.email}</div>;
  } else {
    body = <div>not logged in</div>;
  }

  return (
    <header>
      <nav>
        <Link href='/'>
          <a>Home</a>
        </Link>{' '}
        |{' '}
        <Link href='/register'>
          <a>Register</a>
        </Link>{' '}
        |{' '}
        <Link href='/login'>
          <a>Login</a>
        </Link>{' '}
        |{' '}
        <Link href='/bye'>
          <a>bye</a>
        </Link>{' '}
        |{' '}
        {!loading && data && data.me ? (
          <button
            onClick={async () => {
              await logout();
              setAccessToken('');
              await client!.resetStore();
            }}>
            logout
          </button>
        ) : null}
      </nav>
      {body}
    </header>
  );
};
