import { ApolloProvider } from '@apollo/react-hooks';
import App from 'next/app';
import React from 'react';
import { withApollo } from '../utils/apollo';

class MyApp extends App<any> {
  render() {
    const { Component, pageProps, apolloClient } = this.props;
    return (
      <ApolloProvider client={apolloClient}>
        <Component {...pageProps} />
      </ApolloProvider>
    );
  }
}

export default withApollo(MyApp);
