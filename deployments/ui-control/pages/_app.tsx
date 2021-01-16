import { ApolloProvider } from '@apollo/client';
import { AuthProvider, AlertProvider } from 'components';
import { NextPage } from 'next';
import React from 'react';
import { useApollo } from 'utils/apolloClient';

const App: NextPage<any> = ({ Component, pageProps }) => {
  const apolloClient = useApollo(pageProps.initialApolloState);

  return (
    <AlertProvider>
      <AuthProvider>
        <ApolloProvider client={apolloClient}>
          <Component {...pageProps} />
        </ApolloProvider>
      </AuthProvider>
    </AlertProvider>
  );
};

export default App;
