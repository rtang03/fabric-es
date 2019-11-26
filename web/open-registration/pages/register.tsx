import Avatar from '@material-ui/core/Avatar';
import Button from '@material-ui/core/Button';
import Container from '@material-ui/core/Container';
import Grid from '@material-ui/core/Grid';
import Link from '@material-ui/core/Link';
import { makeStyles, Theme } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import LockOutlinedIcon from '@material-ui/icons/LockOutlined';
import { Form, Formik } from 'formik';
import Router from 'next/router';
import React from 'react';
import * as yup from 'yup';
import { MyTextField } from '../components';
import DisplayErrorMessage from '../components/DisplayErrorMessage';
import Layout from '../components/Layout';
import { useRegisterUserMutation } from '../generated/graphql';

const validationSchema = yup.object({
  username: yup
    .string()
    .required()
    .min(6),
  email: yup
    .string()
    .required()
    .email(),
  password: yup
    .string()
    .required()
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
    marginTop: theme.spacing(3)
  },
  submit: {
    margin: theme.spacing(3, 0, 2)
  }
}));

const Register: React.FC<any> = () => {
  const [register, { error }] = useRegisterUserMutation();
  const classes = useStyles();

  return (
    <Layout title="Account | Register">
      <Container component="main" maxWidth="xs">
        <Avatar className={classes.avatar}>
          <LockOutlinedIcon />
        </Avatar>
        <Typography component="h1" variant="h5">
          Register
        </Typography>
        <Formik
          validateOnChange={true}
          initialValues={{ email: '', password: '', username: '' }}
          validationSchema={validationSchema}
          onSubmit={async (
            { email, password, username },
            { setSubmitting }
          ) => {
            setSubmitting(true);
            return register({ variables: { email, password, username } })
              .then(() => {
                setSubmitting(false);
                Router.push('/');
              })
              .catch(err => {
                setSubmitting(false);
                console.error(err);
              });
          }}>
          {({ values, isSubmitting }) => (
            <Form className={classes.form}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <MyTextField
                    variant="outlined"
                    required
                    fullWidth
                    name="username"
                    placeholder="username"
                    autoComplete="lname"
                  />
                </Grid>
                <Grid item xs={12}>
                  <MyTextField
                    variant="outlined"
                    required
                    fullWidth
                    name="email"
                    placeholder="email"
                    autoComplete="email"
                  />
                </Grid>
                <Grid item xs={12}>
                  <MyTextField
                    variant="outlined"
                    required
                    fullWidth
                    name="password"
                    placeholder="password"
                    type="password"
                    autoComplete="current-password"
                  />
                </Grid>
              </Grid>
              <p />
              <Button
                variant="contained"
                color="primary"
                className={classes.submit}
                disabled={isSubmitting}
                type="submit">
                Register
              </Button>
              <DisplayErrorMessage error={error} />
              <Grid container justify="flex-end">
                <Grid item>
                  <Link href="#" variant="body2">
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
