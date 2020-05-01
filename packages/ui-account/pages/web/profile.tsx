import { FormControlLabel, FormGroup, Switch } from '@material-ui/core';
import Button from '@material-ui/core/Button';
import Typography from '@material-ui/core/Typography';
import { Field, Form, Formik } from 'formik';
import { TextField } from 'formik-material-ui';
import { NextPage } from 'next';
import Router from 'next/router';
import React, { useState } from 'react';
import * as yup from 'yup';
import Layout from '../../components/Layout';
import { User } from '../../server/types';
import { fetchResult, getBackendApi, getValidationSchema, setPostRequest, useStyles } from '../../utils';

const validationSchema = yup.object(getValidationSchema(['username', 'email']));

const Profile: NextPage<{ user: User; apiUrl: string }> = ({ user, apiUrl }) => {
  const [editMode, setEditMode] = useState(false);
  const classes = useStyles();
  const { email, username } = user;
  const handleChange = () => (event: React.ChangeEvent<HTMLInputElement>) => {
    setEditMode(event.target.checked);
  };

  return (
    <Layout title="Account | Profile" user={user}>
      <Typography variant="h6">User profile</Typography>
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
        initialValues={{ username, email }}
        validateOnChange={true}
        validationSchema={validationSchema}
        onSubmit={async ({ username, email }, { setSubmitting }) => {
          setSubmitting(true);
          try {
            const res = await fetch(apiUrl, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
              },
              body: JSON.stringify({ username, email, user_id: user.id }),
              mode: 'cors'
            });
            const { result } = await res.json();
            console.log(result);
            if (res.status === 200) {
              setSubmitting(false);
              await Router.push('/web');
            } else console.error('fail to update profile');
          } catch (e) {
            console.error(e);
            setSubmitting(false);
          }
        }}>
        {({ values, errors, isSubmitting }) => (
          <Form>
            <Field
              disabled={!editMode}
              component={TextField}
              name="username"
              placeholder="username"
              variant="outlined"
              margin="normal"
              fullwidth="true"
              autoFocus
            />{' '}
            <Field
              disabled={!editMode}
              component={TextField}
              name="email"
              placeholder="email"
              variant="outlined"
              margin="normal"
              fullwidth="true"
            />{' '}
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
          </Form>
        )}
      </Formik>{' '}
    </Layout>
  );
};

Profile.getInitialProps = async ctx => {
  const user = await fetchResult<User>(ctx, 'profile');
  const apiUrl = getBackendApi(ctx, 'profile');
  return { user, apiUrl };
};

export default Profile;
