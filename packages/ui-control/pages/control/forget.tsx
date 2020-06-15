import Button from '@material-ui/core/Button';
import Container from '@material-ui/core/Container';
import Grid from '@material-ui/core/Grid';
import Typography from '@material-ui/core/Typography';
import { Field, Form, Formik } from 'formik';
import { TextField } from 'formik-material-ui';
import { NextPage } from 'next';
import Router from 'next/router';
import React, { useEffect } from 'react';
import * as yup from 'yup';
import { useDispatchAlert } from '../../components';
import Layout from '../../components/Layout';
import { useForgetMutation } from '../../graphql/generated';
import { getValidationSchema, useStyles } from '../../utils';

const validation = yup.object(getValidationSchema(['email']));
const ERROR = 'Fail to reset';
const SUCCESS = 'Reset requested';

const Forget: NextPage<any> = () => {
  const dispatch = useDispatchAlert();
  const classes = useStyles();
  const [reset, { data, loading, error }] = useForgetMutation();

  useEffect(() => {
    data?.forget && setTimeout(async () => Router.push('/control/login'), 4000);
  }, [data]);

  error && setTimeout(() => dispatch({ type: 'ERROR', message: ERROR }), 500);

  return (
    <Layout title="Reset" loading={loading}>
      <Container component="main" maxWidth="sm">
        <Typography component="h1" variant="h5">
          Input email to reset password
        </Typography>
        <Formik
          initialValues={{ email: '' }}
          validateOnChange={true}
          validationSchema={validation}
          onSubmit={async ({ email }, { setSubmitting }) => {
            setSubmitting(true);
            try {
              await reset({ variables: { email } });
              setSubmitting(false);
              setTimeout(() => dispatch({ type: 'SUCCESS', message: SUCCESS }), 500);
            } catch (e) {
              console.error(e);
              setSubmitting(false);
              setTimeout(() => dispatch({ type: 'ERROR', message: ERROR }), 500);
            }
          }}>
          {({ values, errors, isSubmitting }) => (
            <Form className={classes.form}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Field
                    size="small"
                    label="Email"
                    component={TextField}
                    name="email"
                    placeholder="email"
                    variant="outlined"
                    margin="normal"
                    fullwidth="true"
                    autoFocus
                  />{' '}
                </Grid>
                <Grid item xs={12}>
                  <Button
                    className={classes.submit}
                    variant="contained"
                    color="primary"
                    disabled={isSubmitting || (!!errors?.email && !values?.email)}
                    type="submit">
                    Reset password
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

export default Forget;
