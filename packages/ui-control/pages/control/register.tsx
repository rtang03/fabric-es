import Button from '@material-ui/core/Button';
import Container from '@material-ui/core/Container';
import Grid from '@material-ui/core/Grid';
import Link from '@material-ui/core/Link';
import Typography from '@material-ui/core/Typography';
import { useAuth, useDispatchAlert, useDispatchAuth } from 'components';
import Layout from 'components/Layout';
import { Field, Form, Formik } from 'formik';
import { TextField } from 'formik-material-ui';
import { useRegisterMutation } from 'graphql/generated';
import { NextPage } from 'next';
import Router from 'next/router';
import React, { useEffect } from 'react';
import { getValidationSchema, useStyles } from 'utils';
import * as yup from 'yup';

const validation = yup.object(getValidationSchema(['username', 'email', 'password']));
const ERROR = 'Fail to register';
const SUCCESS = 'Register successfully';

const Register: NextPage<any> = () => {
  const auth = useAuth();
  const dispatch = useDispatchAlert();
  const dispatchAuth = useDispatchAuth();
  const classes = useStyles();
  const [register, { data, loading, error }] = useRegisterMutation();

  useEffect(() => {
    if (data?.register) {
      setTimeout(() => dispatchAuth({ type: 'REGISTER_SUCCESS' }), 3000);
      setTimeout(
        async () => Router.push(`/control/login?username=${data?.register?.username}`),
        3200
      );
    }
  }, [data]);

  error && setTimeout(() => dispatch({ type: 'ERROR', message: ERROR }), 500);

  return (
    <Layout title="Account | Register" loading={loading}>
      <Container component="main" maxWidth="sm">
        <Typography component="h1" variant="h5">
          Register
        </Typography>
        <Formik
          initialValues={{ username: '', email: '', password: '' }}
          validateOnChange={true}
          validationSchema={validation}
          onSubmit={async ({ username, email, password }, { setSubmitting }) => {
            setSubmitting(true);
            try {
              dispatchAuth({ type: 'REGISTER' });
              await register({ variables: { username, email, password } });
              setSubmitting(false);
              setTimeout(() => dispatch({ type: 'SUCCESS', message: SUCCESS }), 500);
            } catch (e) {
              console.error(e);
              setSubmitting(false);
              dispatchAuth({ type: 'REGISTER_FAILURE' });
              setTimeout(() => dispatch({ type: 'ERROR', message: ERROR }), 500);
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
                    label="Email"
                    component={TextField}
                    name="email"
                    placeholder="email"
                    variant="outlined"
                    margin="normal"
                    fullwidth="true"
                    disabled={auth.loading}
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
                    autoComplete="current-password"
                  />{' '}
                </Grid>
                <Grid item xs={12}>
                  <Button
                    className={classes.submit}
                    variant="contained"
                    color="primary"
                    disabled={
                      isSubmitting ||
                      (!!errors?.email && !values?.email) ||
                      (!!errors?.password && !values?.password) ||
                      auth.loading
                    }
                    type="submit">
                    Register
                  </Button>
                </Grid>
                <Grid item>
                  <Link href="/control/login" variant="caption">
                    Already have an account? Log In
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

export default Register;
