import Typography from '@material-ui/core/Typography';
import { Form, Formik } from 'formik';
import fetch from 'isomorphic-unfetch';
import { NextPage, NextPageContext } from 'next';
import React from 'react';
import DisplayErrorMessage from '../components/DisplayErrorMessage';
import Layout from '../components/Layout';
import { useGetPublicClientsQuery } from '../generated/graphql';

const Peer: NextPage<{ network: any }> = ({ network }) => {
  const { data, error, loading } = useGetPublicClientsQuery();
  const body = loading ? null : data?.getPublicClients ? (
    <React.Fragment>
      <pre>{JSON.stringify(data.getPublicClients, null, 2)}</pre>
      <p>No of available hosts: {data.getPublicClients.length}</p>
    </React.Fragment>
  ) : null;

  return (
    <Layout title="Peer | Enroll">
      <div>
        <Typography component="h1" variant="h6">
          My Profile - Enrollment Peer
        </Typography>
        <pre>{JSON.stringify(network, null, 2)}</pre>
      </div>{' '}
      <div>
        <Typography component="h1" variant="h6">
          Available Hosts for User Enrollment
        </Typography>
      </div>
      {body}
      <DisplayErrorMessage error={error} />
    </Layout>
  );
};

Peer.getInitialProps = async (context: NextPageContext) => {
  const response = await fetch('http://localhost:3000/network');
  const network = await response.json();
  return { network };
};

export default Peer;
