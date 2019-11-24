import { ApolloProvider } from '@apollo/react-hooks';
import App from 'next/app';
import React from 'react';
import { ThemeProvider } from 'styled-components';
import { withApollo } from './withApollo';

// Todo: theme property from styled-components and material UI
// Later, Need to remove either styled-component or material UI
// Avoid to using both, to reduce unnecessary potential conflict
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
