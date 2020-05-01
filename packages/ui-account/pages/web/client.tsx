import { Divider } from '@material-ui/core';
import Typography from '@material-ui/core/Typography';
import { Field, Form, Formik } from 'formik';
import { TextField } from 'formik-material-ui';
import { NextPage } from 'next';
import React from 'react';
import * as yup from 'yup';
import Layout from '../../components/Layout';
import { Client, User } from '../../server/types';
import { fetchResult, getValidationSchema, useStyles } from '../../utils';

const validationSchema = yup.object(getValidationSchema(['application_name', 'client_secret']));

const ClientPage: NextPage<{ user: User; clients: Client[] }> = ({ user, clients }) => {
  const classes = useStyles();

  return (
    <Layout title="Client" user={user}>
      <Typography variant="h6">Client applications</Typography>
      {clients.map(client => (
        <div id={client.id}>{JSON.stringify(client)}</div>
      ))}
      <Divider />
      <Typography variant="h6">Create application</Typography>
      <Formik
        initialValues={{ application_name: '', client_secret: '' }}
        validateOnChange={true}
        validationSchema={validationSchema}
        onSubmit={async ({ application_name, client_secret }, { setSubmitting }) => {
          setSubmitting(true);
        }}>
        {({ values, errors, isSubmitting }) => (
          <Form>
            <Field />
          </Form>
        )}
      </Formik>
    </Layout>
  );
};

ClientPage.getInitialProps = async ctx => {
  const user = await fetchResult<User>(ctx, 'profile');
  const clients = await fetchResult<Client[]>(ctx, 'client');
  return { user, clients };
};

export default ClientPage;
