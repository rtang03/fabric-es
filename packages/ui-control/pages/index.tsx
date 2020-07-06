import Typography from '@material-ui/core/Typography';
import { useDispatchAlert } from 'components';
import Layout from 'components/Layout';
import { NextPage } from 'next';
import React from 'react';

const Index: NextPage<any> = () => {
  const dispatch = useDispatchAlert();

  const handleAlert = () => dispatch({ type: 'SUCCESS', message: 'hello' });

  return (
    <Layout title="Home">
      <Typography variant="h6">HOME</Typography>
      <button onClick={handleAlert}>Alert</button>
    </Layout>
  );
};

export default Index;
