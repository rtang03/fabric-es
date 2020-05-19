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
import Layout from '../components/Layout';
import {
  useMeQuery,
  useVerifyPasswordLazyQuery
} from '@fabric-es/query-handler/dist/__tests__/oauth-server-graphql';
import {
  useGetCaIdentityByEnrollmentIdLazyQuery,
  useGetPeerInfoLazyQuery,
  useIsWalletEntryExistLazyQuery,
  useRegisterAndEnrollUserMutation
} from '@fabric-es/query-handler/dist/__tests__/peer-node-graphql';

const validationSchema = yup.object({
  enrollmentSecret: yup
    .string()
    .required()
    .trim()
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

  const [
    getPeerInfo,
    { data: peerInfoData, loading: peerInfoLoading, error: peerInfoError }
  ] = useGetPeerInfoLazyQuery({
    context: { backend: 'peer' }
  });

  const [
    verifyPw,
    { data: verifyPwData, loading: verifyPwLoading }
  ] = useVerifyPasswordLazyQuery({
    context: { backend: 'oauth' }
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

    if (
      !peerInfoLoading &&
      peerInfoData === undefined &&
      peerInfoError === undefined &&
      !!user_id
    )
      getPeerInfo();
  });

  const caIdentity = idLoading ? null : (
    <>
      {idData?.getCaIdentityByEnrollmentId ? (
        <>
          <div>
            <Typography variant="caption">Enrollment Certificate</Typography>
          </div>
          <pre>
            {JSON.stringify(
              omit(idData?.getCaIdentityByEnrollmentId, '__typename'),
              null,
              2
            )}
          </pre>
        </>
      ) : (
        <div>You are not registered with certificate authority.</div>
      )}
      <div>
        <Typography variant="caption" color="textSecondary">
          {idError?.graphQLErrors[0].message}
        </Typography>
      </div>
    </>
  );

  const peerInfo = peerInfoLoading ? null : (
    <>
      {peerInfoData?.getPeerInfo ? (
        <>
          <div>
            <Typography variant="caption">
              Organization: {peerInfoData.getPeerInfo.mspid}
            </Typography>
          </div>
          <div>
            <Typography variant="caption">
              Peer: {peerInfoData.getPeerInfo.peerName}
            </Typography>
          </div>
        </>
      ) : (
        <React.Fragment />
      )}
      <div>
        <Typography variant="caption" color="textSecondary">
          {peerInfoError?.graphQLErrors[0].message}
        </Typography>
      </div>
    </>
  );

  const walletStatus = walletExistLoading ? null : (
    <>
      {walletExistData?.isWalletEntryExist ? (
        <div>You have enrolled digital wallet.</div>
      ) : (
        <div>You have not enrolled digital wallet.</div>
      )}
      <div>
        <Typography variant="caption" color="textSecondary">
          {walletExistError?.graphQLErrors[0].message}
        </Typography>
      </div>
    </>
  );

  const validateSecret = (password: string) => {
    verifyPw({
      variables: { user_id: user_id as string, password }
    });
  };

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
        <div>{peerInfo}</div>
        <Formik
          validateOnChange={true}
          initialValues={{ enrollmentSecret: '' }}
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
                    name="enrollmentSecret"
                    placeholder="password"
                    type="password"
                    validate={validateSecret}
                    disabled={idData?.getCaIdentityByEnrollmentId?.id !== undefined}
                  />
                  {!verifyPwLoading && verifyPwData ? (
                    <Typography variant="caption" color="secondary">
                      {verifyPwData.verifyPassword ? '' : 'Mis-match'}
                    </Typography>
                  ) : (
                    <React.Fragment />
                  )}
                </Grid>
                <Button
                  className={classes.submit}
                  type="submit"
                  variant="contained"
                  color="primary"
                  disabled={
                    (idData !== undefined && !verifyPwData?.verifyPassword) ||
                    !!idData?.getCaIdentityByEnrollmentId?.id
                  }>
                  Enroll
                </Button>
                <div>
                  <Typography variant="caption" color="textSecondary">
                    {registerError?.graphQLErrors[0].message}
                  </Typography>
                </div>
              </Grid>
            </Form>
          )}
        </Formik>
      </Container>
    </Layout>
  );
};

export default Enrollment;
