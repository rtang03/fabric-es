import Typography from '@material-ui/core/Typography';
import { Form, Formik } from 'formik';
import { NextPage } from 'next';
import React from 'react';
import Layout from '../components/Layout';
import { useMeQuery } from '../generated/oauth-server-graphql';

const Profile: NextPage = () => {
  const { data, loading } = useMeQuery({
    context: { backend: 'oauth' }
  });
  // const user_id = loading ? null : data?.me?.id;
  return (
    <Layout title="Profile">
      <Typography component="h1" variant="h6">
        You are not yet enrolled in current peer
      </Typography>
    </Layout>
  );
};

export default Profile;
