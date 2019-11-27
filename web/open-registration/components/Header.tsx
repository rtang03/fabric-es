import Router from 'next/router';
import React from 'react';
import { useLogoutMutation, useMeQuery } from '../generated/graphql';
import { setAccessToken } from '../utils';
import Link from './Link';

export const Header: React.FC<any> = () => {
  const { data, loading, client } = useMeQuery();
  const [logout] = useLogoutMutation();

  const body = loading ? null : data?.me ? (
    <div>
      <p>you are logged in as: {data.me.email}</p>
    </div>
  ) : (
    <div>
      <p>not logged in</p>
    </div>
  );

  return (
    <header>
      <nav>
        <Link href="/">Home</Link>
        {!loading && !data?.me ? (
          <React.Fragment>
            {' '}
            |{' '}
            <Link href="/register" color="secondary">
              Register
            </Link>{' '}
            | <Link href="/login">Login</Link>
          </React.Fragment>
        ) : !loading && data?.me ? (
          <React.Fragment>
            {' '}
            | <Link href="/application">Client App</Link> |{' '}
            <Link href="/peer">Peer Node</Link> |{' '}
            <button
              onClick={async () => {
                await logout();
                setAccessToken('');
                await Router.replace('/');
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
