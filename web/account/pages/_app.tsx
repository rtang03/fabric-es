import { ApolloProvider } from '@apollo/react-hooks';
import App from 'next/app';
import React from 'react';
import { ThemeProvider } from 'styled-components';
import { withApollo } from '../utils/apollo';

const theme = {
  colors: {
    primary: '#0070f3'
  }
};

class MyApp extends App<any> {
  render() {
    const { Component, pageProps, apolloClient } = this.props;
    return (
      <ThemeProvider theme={theme}>
        <ApolloProvider client={apolloClient}>
          <Component {...pageProps} />
        </ApolloProvider>
      </ThemeProvider>
    );
  }
}

export default withApollo(MyApp);
