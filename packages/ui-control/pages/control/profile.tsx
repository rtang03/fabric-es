import Button from '@material-ui/core/Button';
import Container from '@material-ui/core/Container';
import Divider from '@material-ui/core/Divider';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import FormGroup from '@material-ui/core/FormGroup';
import Grid from '@material-ui/core/Grid';
import LinearProgress from '@material-ui/core/LinearProgress';
import Switch from '@material-ui/core/Switch';
import Typography from '@material-ui/core/Typography';
import { useDispatchAlert } from 'components';
import Layout from 'components/Layout';
import Wallet from 'components/Wallet';
import withAuth from 'components/withAuth';
import { Field, Form, Formik } from 'formik';
import { TextField } from 'formik-material-ui';
import { useMeQuery, useUpdateProfileMutation } from 'graphql/generated';
import { NextPage } from 'next';
import React, { useState } from 'react';
import { getValidationSchema, useStyles } from 'utils';
import * as yup from 'yup';

const validationSchema = yup.object(getValidationSchema(['email']));
const ERROR = 'Fail to update profile';
const message = 'Profile updated';

const Profile: NextPage<any> = () => {
  const dispatchAlert = useDispatchAlert();
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

  updatedError &&
    setTimeout(() => {
      console.error(updatedError);
      dispatchAlert({ type: 'ERROR', message: ERROR });
    }, 500);

  return (
    <Layout title="Profile" loading={loading} user={data?.me} restricted={true}>
      <Container component="main" maxWidth="sm">
        <Typography variant="h6">User profile</Typography>
        <Typography variant="caption">Welcome! {data?.me.username}</Typography>
        {updatedLoaing ? <LinearProgress /> : <Divider />}
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
          initialValues={{ email }}
          validateOnChange={true}
          validationSchema={validationSchema}
          onSubmit={async ({ email }, { setSubmitting }) => {
            setSubmitting(true);
            try {
              const response = await updateProfile({ variables: { id, email, username } });
              if (response?.data?.updateProfile?.ok) {
                await refetch();
                dispatchAlert({ type: 'SUCCESS', message });
              }
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
                {/* <Grid item xs={12}> */}
                {/*  <Field*/}
                {/*    label="Username"*/}
                {/*    disabled={!edit}*/}
                {/*    component={TextField}*/}
                {/*    name="username"*/}
                {/*    placeholder="username"*/}
                {/*    variant="outlined"*/}
                {/*    margin="normal"*/}
                {/*    fullwidth="true"*/}
                {/*    autoFocus*/}
                {/*  />{' '} */}
                {/* </Grid> */}
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
                    disabled={isSubmitting || values?.email === email || !!errors?.email}
                    type="submit">
                    Update
                  </Button>
                </Grid>
              </Grid>
            </Form>
          )}
        </Formik>
        <br />
        <br />
        <Wallet />
      </Container>
    </Layout>
  );
};

export default withAuth(Profile);
