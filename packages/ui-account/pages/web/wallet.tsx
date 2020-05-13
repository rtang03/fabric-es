import Button from '@material-ui/core/Button';
import Typography from '@material-ui/core/Typography';
import { Form, Formik } from 'formik';
import fetch from 'isomorphic-unfetch';
import { NextPage } from 'next';
import React from 'react';
import Layout from '../../components/Layout';
import { User, Wallet } from '../../server/types';
import { fetchResult, getBackendApi, postResultRouting, setPostRequest, useStyles } from '../../utils';

const WalletPage: NextPage<{ user: User; wallet: Wallet; apiUrl: string }> = ({ user, wallet, apiUrl }) => {
  const classes = useStyles();

  return (
    <Layout title="Wallet" user={user}>
      <Typography variant="h6">Digital Wallet</Typography>
      {JSON.stringify(wallet, null, 2)}
      <Formik
        initialValues={{}}
        onSubmit={async (_, { setSubmitting }) => {
          setSubmitting(true);
          try {
            const res = await fetch(`${apiUrl}/create_wallet`, setPostRequest({}, true));
            setSubmitting(false);
            await postResultRouting(res.status, '/web/wallet', 'fail to create wallet');
          } catch (e) {
            console.error(e);
            setSubmitting(false);
          }
        }}>
        {({ isSubmitting }) => (
          <Form>
            {' '}
            <Button
              className={classes.submit}
              variant="contained"
              color="primary"
              disabled={isSubmitting || !!wallet}
              type="submit">
              Create Wallet
            </Button>
          </Form>
        )}
      </Formik>
    </Layout>
  );
};

WalletPage.getInitialProps = async ctx => {
  const user = await fetchResult<User>(ctx, 'profile');
  const wallet = await fetchResult<Wallet>(ctx, 'wallet');
  const apiUrl = getBackendApi(ctx, 'wallet');
  return { apiUrl, user, wallet };
};

export default WalletPage;
