import { Button } from '@material-ui/core';
import { Form, Formik } from 'formik';
import Router from 'next/router';
import React from 'react';
import * as yup from 'yup';
import { MyTextField } from '../components';
import Layout from '../components/Layout';
import { useRegisterUserMutation } from '../generated/graphql';

const validationSchema = yup.object({
  username: yup.string().required(),
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
  const [register] = useRegisterUserMutation();

  return (
    <Layout title="Account | Register">
      <Formik
        validateOnChange={true}
        initialValues={{ email: '', password: '', username: '' }}
        validationSchema={validationSchema}
        onSubmit={async ({ email, password, username }, { setSubmitting }) => {
          setSubmitting(true);
          await register({ variables: { email, password, username } });
          setSubmitting(false);
          await Router.push('/');
        }}>
        {({ values, isSubmitting }) => (
          <Form>
            <div>
              <MyTextField name="username" placeholder="username" />
            </div>
            <div>
              <MyTextField name="email" placeholder="email" />
            </div>
            <div>
              <MyTextField name="password" placeholder="password" />
            </div>
            <div>
              <Button disabled={isSubmitting} type="submit">
                Register
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
