import Button from '@material-ui/core/Button';
import Divider from '@material-ui/core/Divider';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import FormGroup from '@material-ui/core/FormGroup';
import Switch from '@material-ui/core/Switch';
import Typography from '@material-ui/core/Typography';
import { Field, Form, Formik } from 'formik';
import { TextField } from 'formik-material-ui';
import httpStatus from 'http-status';
import { NextPage } from 'next';
import Link from 'next/link';
import Router, { useRouter } from 'next/router';
import React, { useState } from 'react';
import * as yup from 'yup';
import Layout from '../../../../components/Layout';
import { Client, UpdateClientResponse, User } from '../../../../server/types';
import { fetchResult, getBackendApi, getValidationSchema, useStyles } from '../../../../utils';

const validationSchema = yup.object(getValidationSchema(['application_name', 'client_secret', 'redirect_uris']));

const ClientPage: NextPage<{ user: User; apiUrl: string; client: Client }> = ({ apiUrl, client, user }) => {
  const [editMode, setEditMode] = useState(false);
  const router = useRouter();
  const { cid } = router.query;
  const classes = useStyles();
  const { application_name, client_secret, redirect_uris } = client;
  const handleChange = () => ({ target }: React.ChangeEvent<HTMLInputElement>) => {
    setEditMode(target.checked);
  };

  return (
    <Layout title="Client | Details" user={user}>
      <Typography variant="h6">Client application</Typography>
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
          label={editMode ? 'Lock' : 'Unlock'}
        />
      </FormGroup>
      <Formik
        initialValues={{ application_name, client_secret, redirect_uris }}
        validateOnChange={true}
        validationSchema={validationSchema}
        onSubmit={async ({ application_name, client_secret, redirect_uris }, { setSubmitting }) => {
          setSubmitting(true);
          try {
            const res = await fetch(`${apiUrl}/${cid}`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
              },
              mode: 'cors',
              body: JSON.stringify({ application_name, client_secret, redirect_uris })
            });
            const result: UpdateClientResponse = await res.json();
            if (res.status === httpStatus.OK) {
              setSubmitting(false);
              setEditMode(false);
              await Router.push('/web/client');
            } else console.error('fail to update client');
          } catch (e) {
            console.error(e);
            setSubmitting(false);
          }
        }}>
        {({ values, errors, isSubmitting }) => (
          <>
            <Form>
              <Field
                label="Application name"
                disabled={!editMode}
                component={TextField}
                name="application_name"
                placeholder="appplication name"
                variant="outlined"
                margin="normal"
                fullwidth="true"
                autoFocus
              />{' '}
              <Field
                label="Client secret"
                disabled={!editMode}
                component={TextField}
                name="client_secret"
                placeholder="client secret"
                variant="outlined"
                margin="normal"
                fullwidth="true"
              />{' '}
              <Field
                label="Redirect uri"
                disabled={!editMode}
                component={TextField}
                name="redirect_uris"
                placeholder="redirect uris"
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
                  (values?.application_name === application_name && values?.client_secret === client_secret) ||
                  !!errors?.application_name ||
                  !!errors?.client_secret
                }
                type="submit">
                Update
              </Button>
            </Form>
            <p />
            <Divider />
            <Link href="/web/client/[cid]/api_key" as={`/web/client/${cid}/api_key`}>
              <a>Create api_key</a>
            </Link>
          </>
        )}
      </Formik>
    </Layout>
  );
};

ClientPage.getInitialProps = async ctx => {
  const client_id = ctx?.query?.cid;
  const client = await fetchResult<Client>(ctx, `client/${client_id}`);
  const user = await fetchResult<User>(ctx, 'profile');
  const apiUrl = getBackendApi(ctx, 'client');
  return { user, client, apiUrl };
};

export default ClientPage;
