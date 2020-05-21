import { makeStyles, Theme } from '@material-ui/core';
import Button from '@material-ui/core/Button';
import Container from '@material-ui/core/Container';
import Grid from '@material-ui/core/Grid';
import Typography from '@material-ui/core/Typography';
import { Form, Formik } from 'formik';
import { NextPage } from 'next';
import React, { useEffect, useState } from 'react';
import * as yup from 'yup';
import { MyTextField } from '../components';
import Layout from '../components/Layout';
import {
  useCreateRegularAppMutation,
  useGetClientsLazyQuery
} from '@fabric-es/query-handler/dist/__tests__/oauth-server-graphql';

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
    marginTop: theme.spacing(1)
  },
  submit: {
    margin: theme.spacing(3, 0, 2)
  }
}));

const Application: NextPage<any> = () => {
  const [createAppResponse, setCreateAppResponse] = useState<any>({});

  const [
    getClients,
    { data, error, loading, refetch }
  ] = useGetClientsLazyQuery({
    fetchPolicy: 'cache-and-network',
    context: { backend: 'oauth' }
  });

  const [
    createRegularApp,
    { error: createAppError }
  ] = useCreateRegularAppMutation({ context: { backend: 'oauth' } });

  const classes = useStyles();

  useEffect(() => {
    if (!loading && data === undefined && error === undefined) getClients();
  });

  const validationSchema = yup.object({
    applicationName: yup
      .string()
      .lowercase()
      .min(5)
      .trim()
      .required(),
    redirect_uri: yup.string().required()
  });

  return (
    <Layout title="Application">
      <Container component="main" maxWidth="lg">
        <Grid container spacing={2}>
          <Grid item xs={6}>
            <div>
              <Typography component="h1" variant="h6">
                List of Client Applications
              </Typography>
            </div>
            <Formik initialValues={{}} onSubmit={async () => refetch()}>
              <Form>
                <Button type="submit" variant="outlined" color="secondary">
                  Refresh
                </Button>
              </Form>
            </Formik>
            <div>
              <Typography variant="caption" color="textSecondary">
                {error?.graphQLErrors[0].message}
              </Typography>
            </div>
            {!loading && !!data?.getClients ? (
              <>
                <p>No of my application clients: {data.getClients!.length}</p>
                <pre>
                  {JSON.stringify(
                    data.getClients.map(
                      ({
                        id,
                        client_secret,
                        applicationName,
                        redirect_uris
                      }) => ({
                        id,
                        client_secret,
                        applicationName,
                        redirect_uris
                      })
                    ),
                    null,
                    2
                  )}
                </pre>
              </>
            ) : (
              <div />
            )}
          </Grid>
          <Grid item xs={6}>
            <Typography component="h1" variant="h6">
              Create Client Application
            </Typography>
            <Formik
              initialValues={{ applicationName: '', redirect_uri: '' }}
              validateOnChange={true}
              validationSchema={validationSchema}
              onSubmit={async (
                { applicationName, redirect_uri },
                { setSubmitting }
              ) => {
                setSubmitting(true);
                return createRegularApp({
                  variables: {
                    applicationName,
                    redirect_uri,
                    grants: [
                      'password',
                      'authorization_code',
                      'refresh_token',
                      'client_credentials',
                      'implicit'
                    ]
                  }
                })
                  .then(response => {
                    setSubmitting(false);
                    console.log(response);
                    if (response?.data) {
                      // todo: double check it
                      refetch();
                      setCreateAppResponse(response.data.createRegularApp);
                    }
                  })
                  .catch(err => {
                    setSubmitting(false);
                    console.error(err);
                  });
              }}>
              {({ values, isSubmitting }) => (
                <Form className={classes.form}>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <MyTextField
                        name="applicationName"
                        placeholder="application name"
                        variant="outlined"
                        margin="normal"
                        fullwidth
                        autoFocus
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <MyTextField
                        name="redirect_uri"
                        placeholder="redirect URI"
                        variant="outlined"
                        margin="normal"
                        fullwidth
                      />
                    </Grid>
                    <p />
                    <Button
                      className={classes.submit}
                      variant="contained"
                      color="primary"
                      disabled={isSubmitting}
                      type="submit">
                      Create
                    </Button>
                    <div>
                      <Typography variant="caption" color="textSecondary">
                        {createAppError?.graphQLErrors[0].message}
                      </Typography>
                    </div>
                  </Grid>
                  {Object.keys(createAppResponse).length ? (
                    <React.Fragment>
                      <pre>Application Created:</pre>
                      <pre>{JSON.stringify(createAppResponse, null, 2)}</pre>
                    </React.Fragment>
                  ) : null}
                </Form>
              )}
            </Formik>
          </Grid>
        </Grid>
      </Container>
    </Layout>
  );
};

export default Application;
