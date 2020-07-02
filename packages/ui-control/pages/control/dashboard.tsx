import { QueryHandlerEntity } from '@fabric-es/fabric-cqrs';
import { IconButton } from '@material-ui/core';
import Container from '@material-ui/core/Container';
import InputAdornment from '@material-ui/core/InputAdornment';
import Typography from '@material-ui/core/Typography';
import SearchIcon from '@material-ui/icons/Search';
import Pagination from '@material-ui/lab/Pagination';
import { Field, Form, Formik } from 'formik';
import { TextField } from 'formik-material-ui';
import omit from 'lodash/omit';
import { GetServerSideProps, InferGetServerSidePropsType, NextPage } from 'next';
import React from 'react';
import Layout from '../../components/Layout';
import { useFtsEntityLazyQuery } from '../../graphql/generated/queryHandler';
import { User } from '../../types';
import { getServerSideUser, useStyles } from '../../utils';

const Dashboard: NextPage<InferGetServerSidePropsType<typeof getServerSideProps>> = ({ user }) => {
  const classes = useStyles();
  const [search, { data, error, loading, fetchMore }] = useFtsEntityLazyQuery({
    context: { backend: 'queryHandler' },
    fetchPolicy: 'cache-and-network',
  });

  let count: number;
  let total: number;

  if (!loading && data?.fullTextSearchEntity) {
    count = Math.trunc((data.fullTextSearchEntity.total as number) / 2) + 1;
    total = data?.fullTextSearchEntity.total as number;
  }

  const handleChange = async (event: React.ChangeEvent<unknown>, pagenumber: number) => {
    await fetchMore?.({ variables: { cursor: (pagenumber - 1) * 2 } });
  };

  return (
    <Layout title="Dashboard" loading={loading} user={user} restrictedArea={true}>
      {!user ? (
        <>Error when authenticating user</>
      ) : (
        <>
          <Typography component="h1" variant="h6">
            find by entity
          </Typography>
          <Formik
            initialValues={{ query: '', isCommit: false, cursor: 0, pagesize: 2 }}
            onSubmit={async ({ query, cursor, pagesize }, { setSubmitting }) => {
              setSubmitting(true);
              try {
                search({ variables: { query, cursor, pagesize } });
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
                <div>
                  {total ? (
                    <Typography variant="caption">Total: {total}</Typography>
                  ) : (
                    <React.Fragment />
                  )}
                </div>
                {data?.fullTextSearchEntity?.items
                  .map((item) => omit(item, '__typename'))
                  .map((item) => ({
                    ...item,
                    created: new Date(item.created * 1000).toString(),
                    lastModified: new Date(item.lastModified * 1000).toString(),
                  }))
                  .map((item) => (
                    <pre key={item?.id}>{JSON.stringify(item, null, 2)}</pre>
                  ))}
                <Pagination count={count} showFirstButton showLastButton onChange={handleChange} />
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
}> = getServerSideUser();

export default Dashboard;
