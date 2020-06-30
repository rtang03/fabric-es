import Container from '@material-ui/core/Container';
import Typography from '@material-ui/core/Typography';
import SearchIcon from '@material-ui/icons/Search';
import { Field, Form, Formik } from 'formik';
import { TextField } from 'formik-material-ui';
import { NextPage } from 'next';
import Router from 'next/router';
import React, { useEffect } from 'react';
import { useDispatchAlert, useDispatchAuth } from '../../components';
import Layout from '../../components/Layout';
import { useMeQuery } from '../../graphql/generated';
import { useFtsEntityLazyQuery } from '../../graphql/generated/queryHandler';
import { useStyles } from '../../utils';

const ERROR = 'Fail to authenticate';

const Dashboard: NextPage<any> = () => {
  const classes = useStyles();
  const dispatchAlert = useDispatchAlert();
  const dispatchAuth = useDispatchAuth();
  const { data, loading, error } = useMeQuery();
  const [
    search,
    { data: searchResult, error: searchError, loading: searchLoading },
  ] = useFtsEntityLazyQuery();

  if (!loading && data?.me) dispatchAuth({ type: 'LOGIN_SUCCESS', payload: { user: data.me } });

  useEffect(() => {
    if (error) {
      setTimeout(() => {
        dispatchAlert({ type: 'ERROR', message: ERROR });
      }, 100);
      setTimeout(async () => Router.push(`/control`), 3000);
    }
  }, [error]);

  return (
    <Layout title="Dashboard" loading={loading} user={data?.me}>
      {error ? (
        <>Error when authenticating user</>
      ) : (
        <>
          <Typography component="h1" variant="h6">
            find
          </Typography>
          <Formik
            initialValues={{ query: '', isCommit: false, cursor: 0 }}
            onSubmit={async ({ query }, { setSubmitting }) => {
              setSubmitting(true);
              try {
              } catch (e) {
                console.error(e);
                setSubmitting(false);
              }
            }}>
            {({ values, errors, isSubmitting }) => (
              <Form className={classes.form}>
                <Field
                  size="small"
                  label="query"
                  component={TextField}
                  name="query"
                  placeholder="query by"
                  variant="outlined"
                  margin="normal"
                  fullwidth="true"
                  autoFocus
                />
              </Form>
            )}
          </Formik>
        </>
      )}
    </Layout>
  );
};

export default Dashboard;
