// import Link from 'next/link';
import React from 'react';
import { useLogoutMutation, useMeQuery } from '../generated/graphql';
import Link from './Link';

export const Header: React.FC<any> = () => {
  const { data, loading } = useMeQuery();
  const [logout, { client }] = useLogoutMutation();

  let body: any = null;

  if (loading) {
    body = null;
  } else if (data?.me) {
    body = (
      <div>
        <p>you are logged in as: {data.me.email}</p>
      </div>
    );
  } else {
    body = (
      <div>
        <p>not logged in</p>
      </div>
    );
  }

  return (
    <header>
      <nav>
        <Link href="/">
          <a>Home</a>
        </Link>{' '}
        |{' '}
        <Link href="/register" color="secondary">
          <a>Register</a>
        </Link>{' '}
        |{' '}
        <Link href="/login">
          <a>Login</a>
        </Link>{' '}
        |{' '}
        <Link href="/enroll">
          <a>Enroll</a>
        </Link>
        {!loading && data?.me ? (
          <React.Fragment>
            {' '}
            |{' '}
            <button
              onClick={async () => {
                await logout();
                await client!.resetStore();
              }}>
              logout
            </button>
          </React.Fragment>
        ) : null}
      </nav>
      {body}
      <hr />
    </header>
  );
};
