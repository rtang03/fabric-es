import Button from '@material-ui/core/Button';
import Divider from '@material-ui/core/Divider';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import FormGroup from '@material-ui/core/FormGroup';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import Switch from '@material-ui/core/Switch';
import Typography from '@material-ui/core/Typography';
import { Field, Form, Formik } from 'formik';
import { TextField } from 'formik-material-ui';
import httpStatus from 'http-status';
import { NextPage } from 'next';
import Link from 'next/link';
import Router from 'next/router';
import React, { useState } from 'react';
import * as yup from 'yup';
import Layout from '../../components/Layout';
import { Client, User } from '../../server/types';
import { fetchResult, getBackendApi, getValidationSchema, useStyles } from '../../utils';

const validationSchema = yup.object(getValidationSchema(['application_name', 'client_secret']));

const ClientPage: NextPage<{ apiUrl: string; user: User; clients: Client[] }> = ({ apiUrl, user, clients }) => {
  const [editMode, setEditMode] = useState(false);
  const classes = useStyles();
  const handleChange = () => ({ target }: React.ChangeEvent<HTMLInputElement>) => {
    setEditMode(target.checked);
  };

  return (
    <Layout title="Client" user={user}>
      <Typography variant="h6">Client applications</Typography>
      <List>
        {clients.map(client => (
          <div key={client.id}>
            <Formik
              initialValues={{}}
              onSubmit={async (_, { setSubmitting }) => {
                setSubmitting(true);
                try {
                  const res = await fetch(`${apiUrl}/${client.id}`, {
                    method: 'DELETE',
                    headers: { 'Access-Control-Allow-Origin': '*' },
                    mode: 'cors'
                  });
                  const result = await res.json();
                  if (res.status === httpStatus.OK) {
                    setSubmitting(false);
                    await Router.push('/web/client');
                  } else console.error('fail to delete client');
                } catch (e) {
                  console.error(e);
                  setSubmitting(false);
                }
              }}>
              {({ isSubmitting }) => (
                <Form>
                  <ListItem>
                    {' '}
                    <Link key={client.id} href="/web/client/[cid]" as={`/web/client/${client.id}`}>
                      <a>{client.application_name}</a>
                    </Link>{' '}
                    <Button
                      className={classes.submit}
                      variant="contained"
                      color="primary"
                      disabled={isSubmitting}
                      type="submit">
                      Delete
                    </Button>
                  </ListItem>
                </Form>
              )}
            </Formik>
          </div>
        ))}
      </List>
      <Divider />
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
      <Typography variant={editMode ? 'h6' : 'caption'}>Create application</Typography>
      <Formik
        initialValues={{ application_name: '', client_secret: '' }}
        validateOnChange={true}
        validationSchema={validationSchema}
        onSubmit={async ({ application_name, client_secret }, { setSubmitting, setFieldValue }) => {
          setSubmitting(true);
          try {
            const res = await fetch(apiUrl, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
              },
              body: JSON.stringify({ application_name, client_secret, redirect_uris: '' }),
              mode: 'cors'
            });
            const { ok } = await res.json();
            if (ok) {
              setFieldValue('application_name', '');
              setFieldValue('client_secret', '');
            }
            if (res.status === httpStatus.OK) {
              setSubmitting(false);
              setEditMode(false);
              await Router.push('/web/client');
            } else console.error('fail to create client');
          } catch (e) {
            console.error(e);
            setSubmitting(false);
          }
        }}>
        {({ values, errors, isSubmitting }) => (
          <Form>
            <Field
              disabled={!editMode}
              label="Application name"
              component={TextField}
              name="application_name"
              placeholder="application name"
              variant="outlined"
              margin="normal"
              fullwidth="true"
              autoFocus
            />{' '}
            <Field
              disabled={!editMode}
              label="Client secret"
              component={TextField}
              name="client_secret"
              placeholder="client secret"
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
                (!!errors?.application_name && !values?.application_name) ||
                (!!errors?.client_secret && !values?.client_secret)
              }
              type="submit">
              Submit
            </Button>
          </Form>
        )}
      </Formik>
    </Layout>
  );
};

ClientPage.getInitialProps = async ctx => {
  const user = await fetchResult<User>(ctx, 'profile');
  const clients = await fetchResult<Client[]>(ctx, 'client');
  const apiUrl = getBackendApi(ctx, 'client');
  return { user, clients, apiUrl };
};

export default ClientPage;
