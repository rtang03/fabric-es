import Typography from '@material-ui/core/Typography';
import { omit } from 'lodash';
import { NextPage } from 'next';
import React from 'react';
import DisplayErrorMessage from '../components/DisplayErrorMessage';
import Layout from '../components/Layout';
import { useGetPublicClientsQuery } from '../generated/oauth-server-graphql';
import { useGetChannelPeersQuery } from '../generated/peer-node-graphql';

const Peer: NextPage = () => {
  const { data, error, loading } = useGetPublicClientsQuery({
    context: { backend: 'oauth' }
  });
  const { data: peersData, loading: peersLoading } = useGetChannelPeersQuery({
    context: { backend: 'peer' }
  });

  const clientApps = loading ? null : data?.getPublicClients ? (
    <React.Fragment>
      <pre>
        {JSON.stringify(
          data.getPublicClients.map(app => omit(app, '__typename', 'grants')),
          null,
          2
        )}
      </pre>
      <p>No of available hosts: {data?.getPublicClients.length}</p>
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
    <Layout title="Network">
      <div>
        <Typography component="h1" variant="h6">
          Show all peers in current channel
        </Typography>
      </div>
      {peers}
      <div>
        <Typography component="h1" variant="h6">
          Show all client applications
        </Typography>
      </div>
      {clientApps}
      <DisplayErrorMessage error={error} />
    </Layout>
  );
};

export default Peer;
