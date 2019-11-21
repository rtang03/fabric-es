import {
  Button,
  Card,
  CardContent,
  createStyles,
  makeStyles,
  Theme
} from '@material-ui/core';
import { Form, Formik } from 'formik';
import Router from 'next/router';
import React from 'react';
import * as yup from 'yup';
import { MyTextField } from '../components';
import Layout from '../components/Layout';
import { useRegisterUserMutation } from '../generated/graphql';

const validationSchema = yup.object({
  username: yup
    .string()
    .required()
    .min(6),
  email: yup
    .string()
    .required()
    .email(),
  password: yup
    .string()
    .required()
    .min(8)
});

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    card: { maxWidth: 345 }
  })
);
export default () => {
  const [register] = useRegisterUserMutation();
  const classes = useStyles();

  return (
    <Layout title="Account | Register">
      <Card className={classes.card}>
        <CardContent>
          <Formik
            validateOnChange={true}
            initialValues={{ email: '', password: '', username: '' }}
            validationSchema={validationSchema}
            onSubmit={async (
              { email, password, username },
              { setSubmitting }
            ) => {
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
                  <p/>
                  <Button
                    variant="outlined"
                    disabled={isSubmitting}
                    type="submit">
                    Register
                  </Button>
                </div>
              </Form>
            )}
          </Formik>
        </CardContent>
      </Card>
    </Layout>
  );
};
