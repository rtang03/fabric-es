require('dotenv').config();
import Avatar from '@material-ui/core/Avatar';
import Button from '@material-ui/core/Button';
import Checkbox from '@material-ui/core/Checkbox';
import Container from '@material-ui/core/Container';
import Divider from '@material-ui/core/Divider';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Grid from '@material-ui/core/Grid';
import Link from '@material-ui/core/Link';
import { makeStyles, Theme } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import LockOutlinedIcon from '@material-ui/icons/LockOutlined';
import { Form, Formik } from 'formik';
import fetch from 'isomorphic-unfetch';
import { NextPage, NextPageContext } from 'next';
import Router from 'next/router';
import React from 'react';
import * as yup from 'yup';
import { MyTextField } from '../components';
import Layout from '../components/Layout';
import {
  MeDocument,
  MeQuery,
  useLoginMutation
} from '../generated/oauth-server-graphql';

const validationSchema = yup.object({
  email: yup
    .string()
    .required()
    .email(),
  password: yup
    .string()
    .required()
    .trim()
    .min(8)
});

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

const Login: NextPage<{ auth_uri: string }> = ({ auth_uri }) => {
  const [login, { error }] = useLoginMutation({
    context: { backend: 'oauth' }
  });

  const classes = useStyles();

  return (
    <Layout title="Account | Login">
      <Container component="main" maxWidth="xs">
        <Avatar className={classes.avatar}>
          <LockOutlinedIcon />
        </Avatar>
        <Typography component="h1" variant="h5">
          <Button variant="outlined" color="secondary">
            <a href={auth_uri}>Log In with Authorization Server</a>
          </Button>
        </Typography>
        <br />
        <Divider variant="middle" />
        <br />
        <Typography variant="h6">Or, Log in with Email</Typography>
        <Formik
          initialValues={{ email: '', password: '' }}
          validateOnChange={true}
          validationSchema={validationSchema}
          onSubmit={async ({ email, password }, { setSubmitting }) => {
            setSubmitting(true);
            return login({
              variables: { email, password },
              update: (store, { data }) => {
                if (!data) return null;
                store.writeQuery<MeQuery>({
                  query: MeDocument,
                  data: { me: data?.login?.user }
                });
              }
            })
              .then(() => {
                setSubmitting(false);
                Router.push('/');
              })
              .catch(err => {
                setSubmitting(false);
                console.error(err);
              });
          }}>
          {({ values, errors, isSubmitting }) => (
            <Form className={classes.form}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <MyTextField
                    name="email"
                    placeholder="email"
                    variant="outlined"
                    margin="normal"
                    fullwidth
                    autoFocus
                    autoComplete="email"
                  />
                </Grid>
                <Grid item xs={12}>
                  <MyTextField
                    name="password"
                    placeholder="password"
                    variant="outlined"
                    margin="normal"
                    fullwidth
                    type="password"
                    autoComplete="current-password"
                  />
                </Grid>
              </Grid>
              <FormControlLabel
                control={<Checkbox value="remember" color="primary" />}
                label="Remember me"
              />
              <p />
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
              <div>
                <Typography variant="caption" color="textSecondary">
                  {error?.graphQLErrors[0].message}
                </Typography>
              </div>
              <Grid container justify="flex-end">
                <Grid item>
                  <Link href="#" variant="body2">
                    Forgot password?
                  </Link>
                </Grid>
                <Grid item>
                  <Link href="/register" variant="body2">
                    {`Don't have an account? \n Register Me`}
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

Login.getInitialProps = async (context: NextPageContext) => {
  const res = await fetch('http://localhost:3000/auth_uri');
  const auth_uri = await res.text();
  return { auth_uri };
};

export default Login;
