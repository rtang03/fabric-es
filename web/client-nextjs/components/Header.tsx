import Link from 'next/link';
import React from 'react';
import styled from 'styled-components';
import { useLogoutMutation, useMeQuery } from '../generated/graphql';

const Title = styled.span`
  font-size: 24px;
  font-family: sans-serif;
  cursor: pointer;
  color: ${({ theme }) => theme.colors.primary};
`;

export const Header: React.FC<any> = () => {
  const { data, loading } = useMeQuery();
  const [logout, { client }] = useLogoutMutation();

  let body: any = null;

  if (loading) {
    body = null;
  } else if (data?.me) {
    body = <div><p>you are logged in as: {data.me.email}</p></div>;
  } else {
    body = <div><p>not logged in</p></div>;
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
        {!loading && data?.me ? (
          <button
            onClick={async () => {
              await logout();
              await client!.resetStore();
            }}>
            logout
          </button>
        ) : null}
      </nav>
      {body}
      <hr/>
    </header>
  );
};
