import Button from '@material-ui/core/Button';
import Typography from '@material-ui/core/Typography';
import { makeStyles, Theme } from '@material-ui/core/styles';
import { Field, Form, Formik } from 'formik';
import { TextField } from 'formik-material-ui';
import fetch from 'isomorphic-unfetch';
import { NextPage } from 'next';
import React from 'react';
import * as yup from 'yup';
import Layout from '../../components/Layout';

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

const Login: NextPage<{ apiUrl: string }> = ({ apiUrl }) => {
  const classes = useStyles();

  return (
    <Layout title="Account | Log in">
      <Typography variant="h6">log in</Typography>
      <Formik
        initialValues={{ email: '', password: '' }}
        validateOnChange={true}
        validationSchema={validationSchema}
        onSubmit={async ({ email, password }, { setSubmitting }) => {
          setSubmitting(true);
          const res = await fetch(`${apiUrl}`, {
            method: 'GET',
            mode: 'cors',
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*'
            }
          }).then(response => response.json());
          console.log(res);
          setTimeout(() => {
            alert(JSON.stringify(res, null, 2));
            setSubmitting(false);
          }, 400);
        }}>
        {({ values, errors, isSubmitting }) => (
          <Form>
            <Field
              component={TextField}
              name="email"
              placeholder="email"
              variant="outlined"
              margin="normal"
              fullwidth="true"
              autoFocus
              autoComplete="email"
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

Login.getInitialProps = async ({ req }) => {
  // const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
  const protocol = process.env.NODE_ENV === 'production' ? 'http' : 'http';
  const apiUrl = process.browser
    ? `${protocol}://${window.location.host}/web/api`
    : `${protocol}://${req?.headers.host}/web/api`;

  return { apiUrl };
};

export default Login;
