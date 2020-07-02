import { IconButton } from '@material-ui/core';
import Container from '@material-ui/core/Container';
import InputAdornment from '@material-ui/core/InputAdornment';
import Typography from '@material-ui/core/Typography';
import SearchIcon from '@material-ui/icons/Search';
import Pagination from '@material-ui/lab/Pagination';
import { Field, Form, Formik } from 'formik';
import { TextField } from 'formik-material-ui';
import { GetServerSideProps, InferGetServerSidePropsType, NextPage } from 'next';
import Router from 'next/router';
import React, { useEffect } from 'react';
import { useDispatchAlert, useDispatchAuth } from '../../components';
import Layout from '../../components/Layout';
import { useMeQuery } from '../../graphql/generated';
import { useFtsEntityLazyQuery } from '../../graphql/generated/queryHandler';
import { getServerSideUser, useStyles } from '../../utils';
import { User } from '../../types';

const ERROR = 'Fail to authenticate';

const Dashboard: NextPage<InferGetServerSidePropsType<typeof getServerSideProps>> = ({ user }) => {
  const classes = useStyles();
  const dispatchAlert = useDispatchAlert();
  const dispatchAuth = useDispatchAuth();
  // const { data, loading, error } = useMeQuery();
  const [
    search,
    { data: result, error: searchError, loading: searchLoading },
  ] = useFtsEntityLazyQuery({ context: { backend: 'queryHandler' } });

  // if (!loading && data?.me) dispatchAuth({ type: 'LOGIN_SUCCESS', payload: { user: data.me } });

  if (!searchLoading && result?.fullTextSearchEntity) console.log(result.fullTextSearchEntity);

  // useEffect(() => {
  //   if (error) {
  //     setTimeout(() => {
  //       dispatchAlert({ type: 'ERROR', message: ERROR });
  //     }, 100);
  //     setTimeout(async () => Router.push(`/control`), 3000);
  //   }
  // }, [error]);

  return (
    <Layout title="Dashboard" loading={loading} user={data?.me} restrictedArea={true}>
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
                search({ variables: { query } });
              } catch (e) {
                console.error(e);
                setSubmitting(false);
              }
            }}>
            {({ values, errors, isSubmitting }) => (
              <Form className={classes.form}>
                <Field
                  size="small"
                  label="by Entity"
                  component={TextField}
                  name="query"
                  placeholder="@type:org* @id:org*"
                  variant="outlined"
                  margin="normal"
                  fullwidth="true"
                  autoFocus
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton disabled={isSubmitting} type="submit">
                          <SearchIcon />
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
                <pre>{JSON.stringify(result?.fullTextSearchEntity, null, 2)}</pre>
                <Pagination count={10} showFirstButton showLastButton />
              </Form>
            )}
          </Formik>
        </>
      )}
    </Layout>
  );
};

export const getServerSideProps: GetServerSideProps<{
  user: User | null | undefined;
}> = getServerSideUser;

export default Dashboard;
