import { Button } from '@material-ui/core';
import { Form, Formik } from 'formik';
import Router from 'next/router';
import React from 'react';
import * as yup from 'yup';
import { MyTextField } from '../components';
import Layout from '../components/Layout';
import { MeDocument, MeQuery, useLoginMutation } from '../generated/graphql';
import { setAccessToken } from '../utils/accessToken';

const validationSchema = yup.object({
  email: yup
    .string()
    .required()
    .email(),
  password: yup
    .string()
    .required()
    .min(8)
});

export default () => {
  const [login] = useLoginMutation();

  return (
    <Layout title="Account | Login">
      <Formik
        initialValues={{ email: '', password: '' }}
        validateOnChange={true}
        validationSchema={validationSchema}
        onSubmit={async ({ email, password }, { setSubmitting }) => {
          setSubmitting(true);
          const response = await login({
            variables: { email, password },
            update: (store, { data }) => {
              if (!data) {
                return null;
              }
              store.writeQuery<MeQuery>({
                query: MeDocument,
                data: { me: data.login.userProfile }
              });
            }
          });
          console.log(response);
          if (response && response.data) {
            setAccessToken(response.data.login.accessToken);
          }
          setSubmitting(false);
          await Router.push('/');
        }}>
        {({ values, isSubmitting }) => (
          <Form>
            <div>
              <MyTextField name="email" placeholder="email" />
            </div>
            <div>
              <MyTextField name="password" placeholder="password" />
            </div>
            <div>
              <Button disabled={isSubmitting} type="submit">
                Log In
              </Button>
            </div>
            <hr />
            <pre>{JSON.stringify(values, null, 2)}</pre>
          </Form>
        )}
      </Formik>
    </Layout>
  );
};
