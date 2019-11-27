import { makeStyles, Theme } from '@material-ui/core';
import Button from '@material-ui/core/Button';
import Container from '@material-ui/core/Container';
import Grid from '@material-ui/core/Grid';
import Typography from '@material-ui/core/Typography';
import { Form, Formik } from 'formik';
import React, { useEffect } from 'react';
import * as yup from 'yup';
import { MyTextField } from '../components';
import DisplayErrorMessage from '../components/DisplayErrorMessage';
import Layout from '../components/Layout';
import {
  useCreateRegularAppMutation,
  useGetClientsLazyQuery
} from '../generated/graphql';

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

const Application: React.FC<any> = () => {
  const [getClients, { data, error, loading }] = useGetClientsLazyQuery();
  const [
    createRegularApp,
    { error: createAppError }
  ] = useCreateRegularAppMutation();
  // const { data: meData, loading: meLoading } = useMeQuery();
  const classes = useStyles();

  useEffect(() => {
    if (!data?.getClients) getClients();
  }, []);

  const body =
    !loading && !!data ? (
      <React.Fragment>
        <pre>{JSON.stringify(data, null, 2)}</pre>
        {/*<p>No of my application clients: {data.length}</p>*/}
      </React.Fragment>
    ) : null;

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
      <Container component="main" maxWidth="sm">
        <div>
          <Typography component="h1" variant="h5">
            My Application Clients
          </Typography>
        </div>
        {body}
        <DisplayErrorMessage error={error} />
        <hr />
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
              .then(clientApp => {
                setSubmitting(false);
                console.log(clientApp);
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
                <DisplayErrorMessage error={createAppError} />
              </Grid>
              {/*<pre>Input</pre>*/}
              {/*<pre>{JSON.stringify(values, null, 2)}</pre>*/}
            </Form>
          )}
        </Formik>
        <button onClick={() => getClients()}>Click me</button>
        {/*<pre>{JSON.stringify(clients, null, 2)}</pre>*/}
      </Container>
    </Layout>
  );
};

export default Application;
