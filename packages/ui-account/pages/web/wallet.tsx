import Button from '@material-ui/core/Button';
import Typography from '@material-ui/core/Typography';
import { Form, Formik } from 'formik';
import fetch from 'isomorphic-unfetch';
import { NextPage } from 'next';
import React from 'react';
import Layout from '../../components/Layout';
import { User, Wallet } from '../../server/types';
import { fetchBFF, getBackendApi, postResultRouting, setPostRequest, useStyles } from '../../utils';

const WalletPage: NextPage<{ user: User; wallet: Wallet; apiUrl: string; playgroundUrl: string }> = ({
  user,
  wallet,
  apiUrl,
  playgroundUrl
}) => {
  const classes = useStyles();

  return (
    <Layout title="Wallet" user={user} playgroundUrl={playgroundUrl}>
      <Typography variant="h6">Digital wallet</Typography>
      {wallet ? (
        <>
          <div>Type: {wallet.type}</div>
          <br />
          <div>Msp ID: {wallet.mspId}</div>
          <br />
          <p>WARNING: For production deployment, signing certificate needs to remove. </p>
          <div>Certificate: {wallet.certificate}</div>
        </>
      ) : (
        <p>No wallet found</p>
      )}
      <br />
      <br />
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
  const user = await fetchBFF<User>(ctx, 'profile');
  const graphqlResponse = await fetchBFF<{ data: { getWallet: Wallet } }>(ctx, 'wallet');
  const apiUrl = getBackendApi(ctx, 'wallet');
  const { playgroundUrl } = await fetch(getBackendApi(ctx, 'playground')).then(r => r.json());
  return { apiUrl, user, wallet: graphqlResponse?.data?.getWallet, playgroundUrl };
};

export default WalletPage;
