import Button from '@material-ui/core/Button';
import Typography from '@material-ui/core/Typography';
import { Field, Form, Formik } from 'formik';
import { TextField } from 'formik-material-ui';
import httpStatus from 'http-status';
import { NextPage } from 'next';
import React, { useState } from 'react';
import * as yup from 'yup';
import Layout from '../../components/Layout';
import { User } from '../../server/types';
import { getBackendApi, getValidationSchema, postResultRouting, setPostRequest, useStyles } from '../../utils';

const validationSchema = yup.object(getValidationSchema(['username', 'password']));

const Login: NextPage<{ apiUrl: string; user?: User }> = ({ apiUrl, user }) => {
  const [message, setMessage] = useState<string>('');
  const classes = useStyles();
  const handleChange = () => setMessage('');

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
            const errMessage = await postResultRouting(res.status, '/web/profile', 'fail to login');
            if (res.status === httpStatus.UNAUTHORIZED) {
              setMessage(errMessage as string);
            }
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
              onFocus={handleChange}
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
              onFocus={handleChange}
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
            <p>{message}</p>
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
