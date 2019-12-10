import Container from '@material-ui/core/Container';
import Grid from '@material-ui/core/Grid';
import Typography from '@material-ui/core/Typography';
import { omit } from 'lodash';
import { NextPage } from 'next';
import React from 'react';
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
    <>
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
    </>
  ) : null;

  const peers = peersLoading ? null : peersData?.getChannelPeers ? (
    <>
      <pre>
        {JSON.stringify(
          peersData?.getChannelPeers.map(peer => omit(peer, '__typename')),
          null,
          2
        )}
      </pre>
    </>
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
            <div>
              <Typography variant="caption" color="textSecondary">
                {peersError?.graphQLErrors[0].message}
              </Typography>
            </div>
          </Grid>
          <Grid item xs={6}>
            <div>
              <Typography component="h1" variant="h6">
                Show all client applications
              </Typography>
            </div>
            {clientApps}
            <div>
              <Typography variant="caption" color="textSecondary">
                {clientsError?.graphQLErrors[0].message}
              </Typography>
            </div>
          </Grid>
        </Grid>
      </Container>
    </Layout>
  );
};

export default Peer;
