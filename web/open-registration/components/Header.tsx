import Router from 'next/router';
import React, { useEffect } from 'react';
import { useLogoutMutation, useMeLazyQuery } from '../generated/graphql';
import { setAccessToken } from '../utils';
import Link from './Link';

export const Header: React.FC<any> = () => {
  const [me, { data, loading, client }] = useMeLazyQuery();
  const [logout] = useLogoutMutation();
  // const client = useApolloClient();

  useEffect(() => {
    if (!data?.me) me();
  }, []);

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
            | <Link href="/application">Application</Link> |{' '}
            <Link href="/enroll">Enroll</Link> |{' '}
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
