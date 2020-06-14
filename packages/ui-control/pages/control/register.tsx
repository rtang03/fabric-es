import { useMutation, gql } from '@apollo/client';
import Button from '@material-ui/core/Button';
import Typography from '@material-ui/core/Typography';
import { Field, Form, Formik } from 'formik';
import { TextField } from 'formik-material-ui';
import { NextPage } from 'next';
import Router from 'next/router';
import React, { useEffect } from 'react';
import * as yup from 'yup';
import { useDispatchAlert } from '../../components';
import Layout from '../../components/Layout';
import { getValidationSchema, useStyles } from '../../utils';

const meQuery = gql`
  query Me {
    me
  }
`;
const validation = yup.object(getValidationSchema(['username', 'email', 'password']));
const ERROR = 'Fail to register';
const SUCCESS = 'Register successfully';
const registerQuery = gql`
  mutation Register($email: String!, $password: String!, $username: String!) {
    register(email: $email, password: $password, username: $username)
  }
`;

const Register: NextPage<any> = () => {
  const dispatch = useDispatchAlert();
  const classes = useStyles();
  const [register, { data, loading, error }] = useMutation(registerQuery);

  useEffect(() => {
    if (!loading && data?.register) setTimeout(async () => Router.push('/control/login'), 6000);
  }, [data]);

  if (error) setTimeout(() => dispatch({ type: 'ERROR', message: ERROR }), 500);

  return (
    <Layout title="Account | Register" loading={loading}>
      <Typography variant="h6">Register</Typography>
      <Formik
        initialValues={{ username: '', email: '', password: '' }}
        validateOnChange={true}
        validationSchema={validation}
        onSubmit={async ({ username, email, password }, { setSubmitting }) => {
          setSubmitting(true);
          try {
            await register({ variables: { username, email, password } });
            setSubmitting(false);
            setTimeout(() => dispatch({ type: 'SUCCESS', message: SUCCESS }), 500);
          } catch (e) {
            console.error(e);
            setSubmitting(false);
            setTimeout(() => dispatch({ type: 'ERROR', message: ERROR }), 500);
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
              label="Email"
              component={TextField}
              name="email"
              placeholder="email"
              variant="outlined"
              margin="normal"
              fullwidth="true"
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
                isSubmitting ||
                (!!errors?.email && !values?.email) ||
                (!!errors?.password && !values?.password)
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

// export const getStaticProps = async () => {
//   const apolloClient = initializeApollo();
//
//   await apolloClient.query({
//     query: meQuery,
//   });
//
//   return {
//     props: {
//       initialApolloState: apolloClient.cache.extract(),
//     },
//   };
// };

export default Register;
