import { ApolloProvider } from '@apollo/react-hooks';
import CssBaseline from '@material-ui/core/CssBaseline';
import { ThemeProvider } from '@material-ui/core/styles';
import App from 'next/app';
import React from 'react';
import { withApollo } from '../utils';
import theme from '../utils/theme';

class MyApp extends App<any> {
  componentDidMount() {
    // Remove the server-side injected CSS.
    const jssStyles: any = document.querySelector('#jss-server-side');
    if (jssStyles) {
      jssStyles.parentElement.removeChild(jssStyles);
    }
  }

  render() {
    const { Component, pageProps, apolloClient } = this.props;
    return (
      <ThemeProvider theme={theme}>
        <ApolloProvider client={apolloClient}>
          <CssBaseline />
          <Component {...pageProps} />
        </ApolloProvider>
      </ThemeProvider>
    );
  }
}

export default withApollo(MyApp);
