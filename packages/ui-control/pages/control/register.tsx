import Button from '@material-ui/core/Button';
import Container from '@material-ui/core/Container';
import Grid from '@material-ui/core/Grid';
import Link from '@material-ui/core/Link';
import Typography from '@material-ui/core/Typography';
import { Field, Form, Formik } from 'formik';
import { TextField } from 'formik-material-ui';
import { NextPage } from 'next';
import Router from 'next/router';
import React, { useEffect } from 'react';
import * as yup from 'yup';
import { useDispatchAlert } from '../../components';
import Layout from '../../components/Layout';
import { useRegisterMutation } from '../../graphql/generated';
import { getValidationSchema, useStyles } from '../../utils';

const validation = yup.object(getValidationSchema(['username', 'email', 'password']));
const ERROR = 'Fail to register';
const SUCCESS = 'Register successfully';

const Register: NextPage<any> = () => {
  const dispatch = useDispatchAlert();
  const classes = useStyles();
  const [register, { data, loading, error }] = useRegisterMutation();

  useEffect(() => {
    data?.register &&
      setTimeout(
        async () => Router.push(`/control/login?username=${data?.register?.username}`),
        4000
      );
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
              await register({ variables: { username, email, password } });
              setTimeout(() => dispatch({ type: 'SUCCESS', message: SUCCESS }), 500);
            } catch (e) {
              console.error(e);
              setSubmitting(false);
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
                    disabled={isSubmitting}
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
                    disabled={isSubmitting}
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
                    disabled={isSubmitting}
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
                      (!!errors?.password && !values?.password)
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
