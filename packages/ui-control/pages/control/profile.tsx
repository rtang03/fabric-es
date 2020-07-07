import Button from '@material-ui/core/Button';
import Container from '@material-ui/core/Container';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import FormGroup from '@material-ui/core/FormGroup';
import Grid from '@material-ui/core/Grid';
import Switch from '@material-ui/core/Switch';
import Typography from '@material-ui/core/Typography';
import Layout from 'components/Layout';
import withAuth from 'components/withAuth';
import { Field, Form, Formik } from 'formik';
import { TextField } from 'formik-material-ui';
import { useMeQuery, useUpdateProfileMutation } from 'graphql/generated';
import { NextPage } from 'next';
import React, { useEffect, useState } from 'react';
import { getValidationSchema, useStyles } from 'utils';
import * as yup from 'yup';

const validationSchema = yup.object(getValidationSchema(['username', 'email']));

const Profile: NextPage<any> = () => {
  const classes = useStyles();
  const { data, error, loading, refetch } = useMeQuery();
  const [edit, setEdit] = useState(false);
  const [
    updateProfile,
    { data: updated, loading: updatedLoaing, error: updatedError },
  ] = useUpdateProfileMutation({ fetchPolicy: 'no-cache' });

  const handleEdit = () => ({ target }: React.ChangeEvent<HTMLInputElement>) =>
    setEdit(target.checked);

  if (!data?.me)
    return (
      <Layout title="Dashboard" loading={loading} restricted={false}>
        {error?.message}
      </Layout>
    );

  const { username, email, id } = data?.me;

  return (
    <Layout title="Profile" loading={updatedLoaing} user={data?.me} restricted={true}>
      <Container component="main" maxWidth="sm">
        <Typography variant="h6">User profile</Typography>
        <Typography variant="caption">Welcome! {data?.me.username}</Typography>
        <hr />
        <FormGroup row>
          <FormControlLabel
            control={
              <Switch
                size="small"
                checked={edit}
                onChange={handleEdit()}
                value="edit"
                color={edit ? 'primary' : 'secondary'}
              />
            }
            label={edit ? 'Lock' : 'Unlock'}
          />
        </FormGroup>
        <Formik
          initialValues={{ username, email }}
          validateOnChange={true}
          validationSchema={validationSchema}
          onSubmit={async ({ username, email }, { setSubmitting }) => {
            setSubmitting(true);
            try {
              const response = await updateProfile({ variables: { id, email, username } });
              const result = response?.data?.updateProfile;
              result?.ok && (await refetch());
              setEdit(false);
              setSubmitting(false);
            } catch (e) {
              console.error(e);
              setSubmitting(false);
            }
          }}>
          {({ values, errors, isSubmitting }) => (
            <Form>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Field
                    label="Username"
                    disabled={!edit}
                    component={TextField}
                    name="username"
                    placeholder="username"
                    variant="outlined"
                    margin="normal"
                    fullwidth="true"
                    autoFocus
                  />{' '}
                </Grid>
                <Grid item xs={12}>
                  <Field
                    label="Email"
                    disabled={!edit}
                    component={TextField}
                    name="email"
                    placeholder="email"
                    variant="outlined"
                    margin="normal"
                    fullwidth="true"
                  />{' '}
                </Grid>
                <Grid item xs={12}>
                  <Button
                    className={classes.submit}
                    variant="contained"
                    color="primary"
                    disabled={
                      isSubmitting ||
                      (values?.username === username && values?.email === email) ||
                      !!errors?.username ||
                      !!errors?.email
                    }
                    type="submit">
                    Update
                  </Button>
                </Grid>
              </Grid>
            </Form>
          )}
        </Formik>
      </Container>
    </Layout>
  );
};

export default withAuth(Profile);
