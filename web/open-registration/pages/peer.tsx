import { makeStyles, Theme } from '@material-ui/core';
import Container from '@material-ui/core/Container';
import Grid from '@material-ui/core/Grid';
import Typography from '@material-ui/core/Typography';
import { omit } from 'lodash';
import { NextPage } from 'next';
import React from 'react';
import DisplayErrorMessage from '../components/DisplayErrorMessage';
import Layout from '../components/Layout';
import { useGetPublicClientsQuery } from '../generated/oauth-server-graphql';
import { useGetChannelPeersQuery } from '../generated/peer-node-graphql';

const Peer: NextPage = () => {
  const {
    data: clientsData,
    error: clientsError,
    loading: clientsLoading
  } = useGetPublicClientsQuery({
    context: { backend: 'oauth' }
  });
  const {
    data: peersData,
    error: peersError,
    loading: peersLoading
  } = useGetChannelPeersQuery({
    context: { backend: 'peer' }
  });

  const clientApps = clientsLoading ? null : clientsData?.getPublicClients ? (
    <React.Fragment>
      <pre>
        {JSON.stringify(
          clientsData.getPublicClients.map(app =>
            omit(app, '__typename', 'grants')
          ),
          null,
          2
        )}
      </pre>
      <p>No of available hosts: {clientsData?.getPublicClients.length}</p>
    </React.Fragment>
  ) : null;

  const peers = peersLoading ? null : peersData?.getChannelPeers ? (
    <React.Fragment>
      <pre>
        {JSON.stringify(
          peersData?.getChannelPeers.map(peer => omit(peer, '__typename')),
          null,
          2
        )}
      </pre>
    </React.Fragment>
  ) : null;

  return (
    <Layout title="Peer Info">
      <Container component="main" maxWidth="lg">
        <Grid container spacing={2}>
          <Grid item xs={6}>
            <div>
              <Typography component="h1" variant="h6">
                Show all peers in current channel
              </Typography>
            </div>
            {peers}
            <DisplayErrorMessage error={peersError} />
          </Grid>
          <Grid item xs={6}>
            <div>
              <Typography component="h1" variant="h6">
                Show all client applications
              </Typography>
            </div>
            {clientApps}
            <DisplayErrorMessage error={clientsError} />
          </Grid>
        </Grid>
      </Container>
    </Layout>
  );
};

export default Peer;
