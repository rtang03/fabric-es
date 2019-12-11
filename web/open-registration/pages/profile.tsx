import Container from '@material-ui/core/Container';
import Grid from '@material-ui/core/Grid';
import { makeStyles, Theme } from '@material-ui/core/styles';
import { Form, Formik } from 'formik';
import { NextPage } from 'next';
import React, { useEffect } from 'react';
import * as yup from 'yup';
import { MyTextField } from '../components';
import Layout from '../components/Layout';
import {
  useMeQuery,
  useUpdateUserMutation
} from '../generated/oauth-server-graphql';

const validationSchema = yup.object({
  username: yup
    .string()
    .required()
    .min(6),
  email: yup
    .string()
    .required()
    .email(),
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
  form: {
    width: '100%', // Fix IE 11 issue.
    marginTop: theme.spacing(3)
  },
  submit: {
    margin: theme.spacing(3, 0, 2)
  }
}));

const Profile: NextPage = () => {
  const { data: meData, loading: meLoading } = useMeQuery({
    context: { backend: 'oauth' }
  });
  const user = meLoading ? null : meData?.me;
  const uname = user?.username;
  const emailaddress = user?.email;
  const is_admin = user?.is_admin;

  // const [updateUser, { data, error, loading }] = useUpdateUserMutation({
  //   context: { backend: 'oauth' }
  // });
  //
  // useEffect(() => {
  // });

  const classes = useStyles();

  return (
    <Layout title="Profile">
      <Container component="main" maxWidth="lg">
        <Formik
          validateOnChange={true}
          initialValues={{ username: uname, email: emailaddress }}
          validationSchema={validationSchema}
          onSubmit={async ({ username, email }) => {
            console.log('submit');
            return null;
          }}>
          {({ values }) => (
            <Form className={classes.form}>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <MyTextField
                    label="User Name"
                    variant="outlined"
                    required
                    fullWidth
                    name="username"
                    placeholder={values.username}
                  />
                </Grid>
                <Grid item xs={12}>
                  <MyTextField
                    label="Email"
                    variant="outlined"
                    required
                    fullWidth
                    name="email"
                    placeholder={values.email}
                  />
                </Grid>
              </Grid>
            </Form>
          )}
        </Formik>
      </Container>
    </Layout>
  );
};

export default Profile;
