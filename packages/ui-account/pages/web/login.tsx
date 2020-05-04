import Button from '@material-ui/core/Button';
import Typography from '@material-ui/core/Typography';
import { Field, Form, Formik } from 'formik';
import { TextField } from 'formik-material-ui';
import fetch from 'isomorphic-unfetch';
import { NextPage } from 'next';
import Router from 'next/router';
import React from 'react';
import * as yup from 'yup';
import Layout from '../../components/Layout';
import { User } from '../../server/types';
import { getBackendApi, getValidationSchema, postResultRouting, setPostRequest, useStyles } from '../../utils';

const validationSchema = yup.object(getValidationSchema(['username', 'password']));

const Login: NextPage<{ apiUrl: string; user?: User }> = ({ apiUrl, user }) => {
  const classes = useStyles();

  return (
    <Layout title="Account | Log in" user={user}>
      <Typography variant="h6">Log in</Typography>
      <Formik
        initialValues={{ username: '', password: '' }}
        validateOnChange={true}
        validationSchema={validationSchema}
        onSubmit={async ({ username, password }, { setSubmitting }) => {
          setSubmitting(true);
          try {
            const res = await fetch(apiUrl, setPostRequest({ username, password }, true));
            const result = await res.json();
            setSubmitting(false);
            await postResultRouting(res.status, '/web/profile', 'fail to login');
          } catch (e) {
            console.error(e);
            setSubmitting(false);
          }
        }}>
        {({ values, errors, isSubmitting }) => (
          <Form>
            <Field
              label="Username"
              component={TextField}
              name="username"
              placeholder="username"
              variant="outlined"
              margin="normal"
              fullwidth="true"
              autoFocus
            />{' '}
            <Field
              label="Password"
              component={TextField}
              name="password"
              placeholder="password"
              variant="outlined"
              margin="normal"
              fullwidth="true"
              type="password"
              autoComplete="current-password"
            />{' '}
            <Button
              className={classes.submit}
              variant="contained"
              color="primary"
              disabled={
                isSubmitting || (!!errors?.username && !values?.username) || (!!errors?.password && !values?.password)
              }
              type="submit">
              Log In
            </Button>
          </Form>
        )}
      </Formik>
    </Layout>
  );
};

Login.getInitialProps = ctx => ({
  apiUrl: getBackendApi(ctx, 'login')
});

export default Login;
