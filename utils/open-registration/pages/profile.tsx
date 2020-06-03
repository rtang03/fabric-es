import { FormControlLabel, FormGroup, Switch } from '@material-ui/core';
import Button from '@material-ui/core/Button';
import Container from '@material-ui/core/Container';
import Grid from '@material-ui/core/Grid';
import { makeStyles, Theme } from '@material-ui/core/styles';
import { Form, Formik } from 'formik';
import { NextPage } from 'next';
import Router from 'next/router';
import React, { useEffect, useState } from 'react';
import * as yup from 'yup';
import { MyTextField } from '../components';
import Layout from '../components/Layout';
import {
  useMeQuery,
  useUpdateUserMutation
} from '@fabric-es/query-handler/dist/__tests__/oauth-server-graphql';

/**
 * todo: has bugs. Don't bother now. After update of email, will automatically logout
 * but the useUpdateUserMutuation works well.
 */

const validationSchema = yup.object({
  username: yup
    .string()
    .required()
    .min(6),
  email: yup
    .string()
    .required()
    .email()
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
  const [editMode, setEditMode] = useState(false);
  const { data: meData, loading: meLoading, refetch } = useMeQuery({
    context: { backend: 'oauth' }
  });
  const user = meLoading ? null : meData?.me;
  const uname = user?.username;
  const emailaddress = user?.email;
  const is_admin = user?.is_admin;

  const handleChange = () => (event: React.ChangeEvent<HTMLInputElement>) => {
    setEditMode(event.target.checked);
  };

  const [
    updateUser,
    { data: updateUserData, error: updateUserError, loading: updateUserLoading }
  ] = useUpdateUserMutation({
    context: { backend: 'oauth' }
  });

  useEffect(() => {
    refetch();
  });

  const classes = useStyles();

  return (
    <Layout title="Profile">
      <Container component="main" maxWidth="lg">
        <FormGroup row>
          <FormControlLabel
            control={
              <Switch
                size="small"
                checked={editMode}
                onChange={handleChange()}
                value="editMode"
                color={editMode ? 'primary' : 'secondary'}
              />
            }
            label={editMode ? 'Unlock' : 'Lock'}
          />
        </FormGroup>
        <Formik
          validateOnChange={true}
          initialValues={{ username: uname, email: emailaddress }}
          validationSchema={validationSchema}
          onSubmit={async ({ username, email }, { setSubmitting }) => {
            setSubmitting(true);
            return updateUser({ variables: { email, username } })
              .then(() => {
                setSubmitting(false);
                refetch();
                Router.push('/');
              })
              .catch(err => {
                setSubmitting(false);
                console.error(err);
              });
          }}>
          {({ values, errors, isSubmitting }) => (
            <Form className={classes.form}>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <MyTextField
                    disabled={!editMode}
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
                    disabled={!editMode}
                    label="Email"
                    variant="outlined"
                    required
                    fullWidth
                    name="email"
                    placeholder={values.email}
                  />
                </Grid>
                <Button
                  variant="contained"
                  color="primary"
                  className={classes.submit}
                  disabled={
                    !editMode ||
                    isSubmitting ||
                    (!!errors?.username && !values?.username) ||
                    (!!errors?.email && !values?.email)
                  }
                  type="submit">
                  Save
                </Button>
              </Grid>
            </Form>
          )}
        </Formik>
      </Container>
    </Layout>
  );
};

export default Profile;
