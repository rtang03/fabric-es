import Router from 'next/router';
import React from 'react';
import {
  useLogoutMutation,
  useMeQuery
} from '../generated/oauth-server-graphql';
import { setAccessToken } from '../utils';
import Link from './Link';

export const Header: React.FC<any> = () => {
  const { data, loading, client } = useMeQuery({
    context: { backend: 'oauth' }
  });

  const [logout] = useLogoutMutation({
    context: { backend: 'oauth' }
  });

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
            <Link href="/peer">Peer Info</Link> |{' '}
            <Link href="/enrollment">Enrollment</Link> |{' '}
            <Link href="/playground">Playground</Link> |{' '}
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
