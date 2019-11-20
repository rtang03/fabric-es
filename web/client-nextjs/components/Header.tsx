import Link from 'next/link';
import React from 'react';
import styled from 'styled-components';
import { useLogoutMutation, useMeQuery } from '../generated/graphql';
import { setAccessToken } from '../utils/accessToken';

const Title = styled.span`
  font-size: 24px;
  cursor: pointer;
  color: ${({ theme }) => theme.colors.primary};
`;

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
        <Link href="/">
          <Title>
            <a>Home</a>
          </Title>
        </Link>{' '}
        |{' '}
        <Link href="/register">
          <Title>
            <a>Register</a>
          </Title>
        </Link>{' '}
        |{' '}
        <Link href="/login">
          <Title>
            <a>Login</a>
          </Title>
        </Link>{' '}
        |{' '}
        {/*<Link href="/client">*/}
        {/*  <Title>*/}
        {/*    <a>Client</a>*/}
        {/*  </Title>*/}
        {/*</Link>{' '}*/}
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
