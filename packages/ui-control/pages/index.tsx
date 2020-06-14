import Typography from '@material-ui/core/Typography';
import { NextPage } from 'next';
import React from 'react';
import { useDispatchAlert } from '../components';
import Layout from '../components/Layout';

const Index: NextPage<any> = () => {
  const dispatch = useDispatchAlert();

  const handleAlert = () => dispatch({ type: 'SUCCESS', message: 'hello' });

  return (
    <Layout title="Home">
      <Typography variant="h3">HOME</Typography>
      <button onClick={handleAlert}>Alert</button>
    </Layout>
  );
};

export default Index;
