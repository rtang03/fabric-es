import Button from '@material-ui/core/Button';
import Container from '@material-ui/core/Container';
import Divider from '@material-ui/core/Divider';
import LinearProgress from '@material-ui/core/LinearProgress';
import Typography from '@material-ui/core/Typography';
import { Formik, Form } from 'formik';
import { useGetWalletQuery, WalletEntry, useCreateWalletMutation } from 'graphql/generated/gateway';
import React from 'react';
import { useStyles } from '../utils';
import { useDispatchAlert } from './AlertProvider';

const options = { context: { backend: 'gateway' } };
const ERROR = 'Fail to create wallet';
const message = 'Digital wallet created';

const Wallet: React.FC<any> = () => {
  const dispatchAlert = useDispatchAlert();
  const { data, loading, error, refetch } = useGetWalletQuery({
    ...options,
    fetchPolicy: 'cache-and-network',
  });
  const [
    create,
    { data: dataCreate, loading: createLoading, error: createError },
  ] = useCreateWalletMutation(options);
  const wallet = data?.getWallet as WalletEntry;
  const classes = useStyles();

  (createError || error) &&
    setTimeout(() => {
      console.error(createError || error);
      dispatchAlert({ type: 'ERROR', message: ERROR });
    });

  return (
    <Container>
      {loading || createLoading ? <LinearProgress /> : <Divider />}
      <Typography variant="h6">Digital wallet</Typography>
      {wallet ? (
        <>
          <div>Type: {wallet.type}</div>
          <br />
          <div>Msp ID: {wallet.mspId}</div>
          <p>WARNING: For production deployment, signing certificate needs to remove. </p>
          <div>Certificate: {wallet.certificate}</div>
        </>
      ) : (
        <p>No wallet found. You may create new wallet. Once created, cannot be removed.</p>
      )}
      <br />
      <Formik
        initialValues={{}}
        onSubmit={async (_, { setSubmitting }) => {
          setSubmitting(true);
          try {
            const response = await create();
            if (response?.data?.createWallet) {
              await refetch();
              dispatchAlert({ type: 'SUCCESS', message });
            }
            setSubmitting(false);
          } catch (e) {
            console.error(e);
            setSubmitting(false);
          }
        }}>
        {({ isSubmitting }) => (
          <Form>
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
    </Container>
  );
};

export default Wallet;
