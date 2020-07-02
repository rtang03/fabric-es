import { IconButton } from '@material-ui/core';
import Container from '@material-ui/core/Container';
import Grid from '@material-ui/core/Grid';
import InputAdornment from '@material-ui/core/InputAdornment';
import Typography from '@material-ui/core/Typography';
import SearchIcon from '@material-ui/icons/Search';
import Pagination from '@material-ui/lab/Pagination';
import ToggleButton from '@material-ui/lab/ToggleButton';
import ToggleButtonGroup from '@material-ui/lab/ToggleButtonGroup';
import { Field, Form, Formik } from 'formik';
import { TextField } from 'formik-material-ui';
import { GetServerSideProps, InferGetServerSidePropsType, NextPage } from 'next';
import React from 'react';
import Entity from '../../components/Entity';
import Layout from '../../components/Layout';
import ProTip from '../../components/ProTip';
import { useFtsEntityLazyQuery } from '../../graphql/generated/queryHandler';
import { User } from '../../types';
import { getServerSideUser, useStyles } from '../../utils';
// import SearchIcon from '@material-ui/icons/Search';

const PAGESIZE = 2;

const Dashboard: NextPage<InferGetServerSidePropsType<typeof getServerSideProps>> = ({ user }) => {
  const classes = useStyles();
  const [search, { data, error, loading, fetchMore }] = useFtsEntityLazyQuery({
    context: { backend: 'queryHandler' },
    fetchPolicy: 'cache-and-network',
  });

  let count: number;
  let total: number;

  if (!loading && data?.fullTextSearchEntity) {
    count = Math.ceil((data.fullTextSearchEntity.total as number) / PAGESIZE);
    total = data?.fullTextSearchEntity.total as number;
  }

  const handleChange = async (event: React.ChangeEvent<unknown>, pagenumber: number) => {
    await fetchMore?.({ variables: { cursor: (pagenumber - 1) * PAGESIZE } });
  };

  return (
    <Layout title="Dashboard" loading={loading} user={user} restrictedArea={true}>
      {!user ? (
        <>Error when authenticating user</>
      ) : (
        <Container>
          <p />
          <ToggleButtonGroup aria-label="text alignment" exclusive>
            <ToggleButton value="left" aria-label="left aligned">
              Entity
            </ToggleButton>
            <ToggleButton value="right" aria-label="right aligned">
              Commit
            </ToggleButton>
          </ToggleButtonGroup>
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
            {({ isSubmitting }) => (
              <Form className={classes.form}>
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <Field
                      className={classes.textField}
                      size="small"
                      label="by Entity"
                      component={TextField}
                      name="query"
                      placeholder="@type:coun* @id:count* @event:{inc*} @creator:admin*"
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
                    />{' '}
                  </Grid>
                </Grid>
                <div>
                  {total ? (
                    <Typography variant="caption">Total: {total}</Typography>
                  ) : (
                    <React.Fragment />
                  )}
                </div>
                <Entity entities={data?.fullTextSearchEntity?.items} />
                <Pagination count={count} showFirstButton showLastButton onChange={handleChange} />
                {error ? <pre>JSON.stringify(error, null, 2)</pre> : <React.Fragment />}
              </Form>
            )}
          </Formik>
          <ProTip />
        </Container>
      )}
    </Layout>
  );
};

export const getServerSideProps: GetServerSideProps<{
  user: User | null | undefined;
}> = getServerSideUser();

export default Dashboard;
