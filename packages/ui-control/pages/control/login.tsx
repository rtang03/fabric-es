import Button from '@material-ui/core/Button';
import Container from '@material-ui/core/Container';
import Grid from '@material-ui/core/Grid';
import Link from '@material-ui/core/Link';
import Typography from '@material-ui/core/Typography';
import { useAuth, useDispatchAlert, useDispatchAuth } from 'components';
import Layout from 'components/Layout';
import { Field, Form, Formik } from 'formik';
import { TextField } from 'formik-material-ui';
import { useLoginMutation } from 'graphql/generated';
import { NextPage } from 'next';
import Router from 'next/router';
import React, { useEffect } from 'react';
import { getValidationSchema, saveToken, useStyles } from 'utils';
import * as yup from 'yup';

const validation = yup.object(getValidationSchema(['username', 'password']));
const ERROR = 'Fail to login';
const SUCCESS = 'logged in';

const Login: NextPage<any> = () => {
  const auth = useAuth();
  const dispatchAlert = useDispatchAlert();
  const dispatchAuth = useDispatchAuth();
  const classes = useStyles();

  // must use 'no-cache'
  const [login, { data, loading, error }] = useLoginMutation({ fetchPolicy: 'no-cache' });

  useEffect(() => {
    data?.login && setTimeout(async () => Router.push('/control'), 3200);
  }, [data]);

  error && setTimeout(() => dispatchAlert({ type: 'ERROR', message: ERROR }), 500);

  return (
    <Layout title="Account | Login" loading={loading}>
      <Container component="main" maxWidth="sm">
        <Typography variant="h6">Log in</Typography>
        <Formik
          initialValues={{ username: '', password: '' }}
          validateOnChange={true}
          validationSchema={validation}
          onSubmit={async ({ username, password }, { setSubmitting }) => {
            setSubmitting(true);
            try {
              dispatchAuth({ type: 'LOGIN' });
              const response = await login({ variables: { username, password } });
              const result = response?.data?.login;

              // save accessToken
              saveToken(result?.access_token, result?.jwtExpiryInSec as any);

              setSubmitting(false);
              setTimeout(
                () => dispatchAlert({ type: 'SUCCESS', message: `${username} ${SUCCESS}` }),
                500
              );
            } catch (e) {
              console.error(e);
              setSubmitting(false);
              dispatchAuth({ type: 'LOGIN_FAILURE' });
              setTimeout(() => dispatchAlert({ type: 'ERROR', message: ERROR }), 500);
            }
          }}>
          {({ values, errors, isSubmitting }) => (
            <Form className={classes.form}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Field
                    size="small"
                    label="Username"
                    component={TextField}
                    name="username"
                    placeholder="username"
                    variant="outlined"
                    margin="normal"
                    fullwidth="true"
                    disabled={auth.loading}
                    autoFocus
                  />{' '}
                </Grid>
                <Grid item xs={12}>
                  <Field
                    size="small"
                    label="Password"
                    component={TextField}
                    name="password"
                    placeholder="password"
                    variant="outlined"
                    margin="normal"
                    fullwidth="true"
                    type="password"
                    disabled={auth.loading}
                  />{' '}
                </Grid>
                <Grid item xs={12}>
                  <Button
                    className={classes.submit}
                    variant="contained"
                    color="primary"
                    disabled={
                      isSubmitting ||
                      (!!errors?.username && !values?.username) ||
                      (!!errors?.password && !values?.password) ||
                      auth.loading
                    }
                    type="submit">
                    Log In
                  </Button>{' '}
                </Grid>
                <Grid item>
                  <Link href="/control/forget" variant="caption">
                    Forgot username / password ?
                  </Link>
                </Grid>
              </Grid>
            </Form>
          )}
        </Formik>
      </Container>
    </Layout>
  );
};

export default Login;
