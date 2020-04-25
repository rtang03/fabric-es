import Button from '@material-ui/core/Button';
import Typography from '@material-ui/core/Typography';
import { Field, Form, Formik } from 'formik';
import { TextField } from 'formik-material-ui';
import fetch from 'isomorphic-unfetch';
import { NextPage } from 'next';
import React from 'react';
import * as yup from 'yup';
import { getApiUrl, getValidationSchema, setPostRequest, useStyles } from '../../components';
import Layout from '../../components/Layout';

const validationSchema = yup.object(getValidationSchema(['username', 'email', 'password']));

const Register: NextPage<{ apiUrl: string }> = ({ apiUrl }) => {
  const classes = useStyles();

  return (
    <Layout title="Account | Register">
      {' '}
      <Typography variant="h6">Register</Typography>
      <Formik
        initialValues={{ username: '', email: '', password: '' }}
        validateOnChange={true}
        validationSchema={validationSchema}
        onSubmit={async ({ username, email, password }, { setSubmitting }) => {
          setSubmitting(true);
          let res: any;
          try {
            res = await fetch(`${apiUrl}/register`, setPostRequest({ username, password, email }, true)).then(r =>
              r.json()
            );
          } catch (e) {
            console.error(e);
            setSubmitting(false);
          }
          setTimeout(() => {
            // alert(JSON.stringify(res, null, 2));
            setSubmitting(false);
          }, 400);
        }}>
        {({ values, errors, isSubmitting }) => (
          <Form>
            {' '}
            <Field
              component={TextField}
              name="username"
              placeholder="username"
              variant="outlined"
              margin="normal"
              fullwidth="true"
              autoFocus
            />{' '}
            <Field
              component={TextField}
              name="email"
              placeholder="email"
              variant="outlined"
              margin="normal"
              fullwidth="true"
            />{' '}
            <Field
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
                isSubmitting || (!!errors?.email && !values?.email) || (!!errors?.password && !values?.password)
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

Register.getInitialProps = getApiUrl();

export default Register;
