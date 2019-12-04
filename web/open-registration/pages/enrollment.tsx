import Button from '@material-ui/core/Button';
import Container from '@material-ui/core/Container';
import Divider from '@material-ui/core/Divider';
import Grid from '@material-ui/core/Grid';
import { makeStyles, Theme } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import { Form, Formik } from 'formik';
import { omit } from 'lodash';
import { NextPage } from 'next';
import React, { useEffect } from 'react';
import * as yup from 'yup';
import { MyTextField } from '../components';
import DisplayErrorMessage from '../components/DisplayErrorMessage';
import Layout from '../components/Layout';
import { useMeQuery } from '../generated/oauth-server-graphql';
import {
  useGetCaIdentityByEnrollmentIdLazyQuery,
  useIsWalletEntryExistLazyQuery,
  useRegisterAndEnrollUserMutation
} from '../generated/peer-node-graphql';

const validationSchema = yup.object({
  enrollmentSecret: yup
    .string()
    .required()
    .trim()
    .min(8)
});

const useStyles = makeStyles((theme: Theme) => ({
  '@global': {
    body: {
      backgroundColor: theme.palette.common.white
    }
  },
  paper: {
    marginTop: theme.spacing(8),
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center'
  },
  avatar: {
    margin: theme.spacing(1),
    backgroundColor: theme.palette.secondary.main
  },
  form: {
    width: '100%', // Fix IE 11 issue.
    marginTop: theme.spacing(3)
  },
  submit: {
    margin: theme.spacing(3, 0, 2)
  }
}));

const Enrollment: NextPage = () => {
  const { data: meData, loading: meLoading } = useMeQuery({
    context: { backend: 'oauth' }
  });
  const user_id = meLoading ? null : meData?.me?.id;

  const [
    getCaIdentity,
    { data: idData, loading: idLoading, error: idError, refetch: idRefetch }
  ] = useGetCaIdentityByEnrollmentIdLazyQuery({
    variables: { enrollmentId: user_id || '' },
    fetchPolicy: 'cache-and-network',
    context: { backend: 'peer' }
  });

  const [
    getIsWalletEntryExist,
    {
      data: walletExistData,
      loading: walletExistLoading,
      error: walletExistError,
      refetch: walletExistRefetch
    }
  ] = useIsWalletEntryExistLazyQuery({
    variables: { label: user_id || '' },
    context: { backend: 'peer' }
  });

  const [register, { error: registerError }] = useRegisterAndEnrollUserMutation(
    {
      context: { backend: 'peer' }
    }
  );

  const classes = useStyles();

  // should verify against undefined
  useEffect(() => {
    if (
      !idLoading &&
      idData === undefined &&
      idError === undefined &&
      !!user_id
    )
      getCaIdentity();

    if (
      !walletExistLoading &&
      walletExistData === undefined &&
      walletExistError === undefined &&
      !!user_id
    )
      getIsWalletEntryExist();
  });

  const caIdentity = idLoading ? null : (
    <React.Fragment>
      {idData?.getCaIdentityByEnrollmentId ? (
        <pre>
          {JSON.stringify(
            omit(idData?.getCaIdentityByEnrollmentId, '__typename')
          )}
        </pre>
      ) : (
        <div>You are not registered with certificate authority.</div>
      )}
      <DisplayErrorMessage error={idError} />
    </React.Fragment>
  );

  const walletStatus = walletExistLoading ? null : (
    <React.Fragment>
      {walletExistData?.isWalletEntryExist ? (
        <div>You have enrolled digital wallet.</div>
      ) : (
        <div>You have not enrolled digital wallet.</div>
      )}
      <DisplayErrorMessage error={walletExistError} />
    </React.Fragment>
  );

  return (
    <Layout title="Account | Enrollment">
      <Container component="main" maxWidth="sm">
        <Typography component="h1" variant="h6">
          Enrollment Status
        </Typography>
        <Typography variant="caption">Account number: {user_id}</Typography>
        <br />
        <br />
        <div>{caIdentity}</div>
        <div>{walletStatus}</div>
        <br />
        <Divider />
        <br />
        <div>
          <Typography variant="h6">Enrollment Target</Typography>
        </div>
        <div>
          <Typography variant="caption">Organization: </Typography>
        </div>
        <div>
          <Typography variant="caption">Peer: </Typography>
        </div>
        <Formik
          initialValues={{ enrollmentSecret: '' }}
          validateOnChange={true}
          validationSchema={validationSchema}
          onSubmit={async ({ enrollmentSecret }, { setSubmitting }) => {
            setSubmitting(true);
            return register({
              variables: {
                enrollmentId: user_id as string,
                enrollmentSecret
              }
            })
              .then(() => {
                idRefetch();
                walletExistRefetch();
                setSubmitting(false);
              })
              .catch(err => {
                idRefetch();
                walletExistRefetch();
                setSubmitting(false);
                console.error(err);
              });
          }}>
          {({ isSubmitting }) => (
            <Form className={classes.form}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <MyTextField
                    variant="outlined"
                    required
                    fullWidth
                    name="password"
                    placeholder="password"
                    autoComplete="current-password"
                  />
                </Grid>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  disabled={isSubmitting}>
                  Enroll
                </Button>
                <DisplayErrorMessage error={registerError} />
              </Grid>
            </Form>
          )}
        </Formik>
      </Container>
    </Layout>
  );
};

export default Enrollment;
