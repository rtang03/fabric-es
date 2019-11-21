require('dotenv').config();
import {
  Button,
  createStyles,
  Divider,
  makeStyles,
  Theme
} from '@material-ui/core';
import { Form, Formik } from 'formik';
import Router from 'next/router';
import React from 'react';
import * as yup from 'yup';
import { MyTextField } from '../components';
import Layout from '../components/Layout';
import { MeDocument, MeQuery, useLoginMutation } from '../generated/graphql';
import fetch from 'isomorphic-unfetch';

const validationSchema = yup.object({
  email: yup
    .string()
    .required()
    .email(),
  password: yup
    .string()
    .required()
    .min(8)
});

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    card: { maxWidth: 345 },
    root: {
      width: '100%',
      maxWidth: 360,
      backgroundColor: theme.palette.background.paper
    },
    section1: {
      margin: theme.spacing(3, 2)
    },
    section2: {
      margin: theme.spacing(2)
    },
    section3: {
      margin: theme.spacing(3, 1, 1)
    }
  })
);

const Login = ({ auth_uri }: { auth_uri: string }) => {
  const [login] = useLoginMutation();
  const classes = useStyles();
  return (
    <Layout title="Account | Login">
      <div className={classes.root}>
        <div className={classes.section1}>
          <Button variant="outlined" color="secondary">
            <a href={auth_uri}>Log In with Authorization Server</a>
          </Button>
        </div>
        <Divider variant="middle" />
        <p>Or, Log in with Email</p>
        <div className={classes.section2}>
          <Formik
            initialValues={{ email: '', password: '' }}
            validateOnChange={true}
            validationSchema={validationSchema}
            onSubmit={async ({ email, password }, { setSubmitting }) => {
              setSubmitting(true);
              const response = await login({
                variables: { email, password },
                update: (store, { data }) => {
                  if (!data) return null;
                  store.writeQuery<MeQuery>({
                    query: MeDocument,
                    data: { me: data.login.user }
                  });
                }
              });
              console.log(response);
              // todo: server should not send response with accessToken
              // should do it with res.cookie.
              // below code should be replaced.
              // if (response && response.data) {
              //   setAccessToken(response.data.login.accessToken);
              // }
              setSubmitting(false);
              await Router.push('/');
            }}>
            {({ values, isSubmitting }) => (
              <Form>
                <div>
                  <MyTextField name="email" placeholder="email" />
                </div>
                <div>
                  <MyTextField name="password" placeholder="password" />
                </div>
                <div>
                  <p />
                  <Button
                    variant="outlined"
                    disabled={isSubmitting}
                    type="submit">
                    Log In
                  </Button>
                </div>
                {/*<hr />*/}
                {/*<pre>Input</pre>*/}
                {/*<pre>{JSON.stringify(values, null, 2)}</pre>*/}
              </Form>
            )}
          </Formik>
        </div>
      </div>
    </Layout>
  );
};

Login.getInitialProps = async (context: any) => {
  const res = await fetch('http://localhost:3000/auth_uri');
  const auth_uri = await res.text();
  return { auth_uri };
};

export default Login;
