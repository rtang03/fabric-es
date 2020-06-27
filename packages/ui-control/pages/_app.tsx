import { ApolloProvider } from '@apollo/client';
import { NextPage } from 'next';
import React from 'react';
import { AuthProvider, AlertProvider } from '../components';
import { useApollo } from '../utils/apolloClient';

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
