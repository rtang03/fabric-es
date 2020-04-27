import cookie from 'cookie';
import httpStatus from 'http-status';
import { NextPage } from 'next';
import Router from 'next/router';
import React from 'react';
import Layout from '../../components/Layout';
import { User } from '../../types';

const Profile: NextPage<User> = user => {
  return (
    <Layout title="Account | Profile" user={user}>
      <div>id: {user?.id}</div>
      <div>username: {user?.username}</div>
      <div>email: {user?.email}</div>
    </Layout>
  );
};

Profile.getInitialProps = async ({ req, res }) => {
  const protocol = process.env.NODE_ENV === 'production' ? 'http' : 'http';

  if (typeof window === 'undefined') {
    const cookies = cookie.parse(req?.headers.cookie ?? '');
    const token = cookies.jid;
    if (!token) {
      res?.writeHead(httpStatus.NOT_FOUND, { Location: '/web/login' });
      res?.end();
      return null;
    }
    try {
      return await fetch(`${protocol}://${req?.headers.host}/web/api/profile`, {
        headers: { cookie: `jid=${token}` }
      }).then(r => r.json());
    } catch (e) {
      console.error(e);
      return null;
    }
  } else {
    const response = await fetch(`${protocol}://${window.location.host}/web/api/profile`);

    if (response.status === httpStatus.UNAUTHORIZED) {
      await Router.push('/web/login');
      return null;
    }

    if (response.status !== httpStatus.OK) throw new Error(await response.text());
    return await response.json();
  }
};

export default Profile;
