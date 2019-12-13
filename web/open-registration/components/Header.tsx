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

  const is_admin = data?.me?.is_admin;

  return (
    <header>
      <nav>
        <Link href="/">Home</Link>
        {!loading && !data?.me ? (
          <>
            {' '}
            |{' '}
            <Link href="/register" color="secondary">
              Register
            </Link>{' '}
            | <Link href="/login">Login</Link>
          </>
        ) : !loading && data?.me ? (
          <>
            {' '}
            |{' '}
            {is_admin ? (
              <>
                <Link href="/application">Client App</Link> |{' '}
                <Link href="/peer">Peer Info</Link> |{' '}
              </>
            ) : (
              <React.Fragment />
            )}
            <Link href="/enrollment">Enrollment</Link> |{' '}
            {/*<Link href="/profile">Profile</Link> |{' '}*/}
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
          </>
        ) : null}
      </nav>
      {body}
      <hr />
    </header>
  );
};
