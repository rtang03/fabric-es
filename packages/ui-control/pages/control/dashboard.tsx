import Container from '@material-ui/core/Container';
import Grid from '@material-ui/core/Grid';
import ChangeHistoryIcon from '@material-ui/icons/ChangeHistory';
import FindInPageIcon from '@material-ui/icons/FindInPage';
import Pagination from '@material-ui/lab/Pagination';
import ToggleButton from '@material-ui/lab/ToggleButton';
import ToggleButtonGroup from '@material-ui/lab/ToggleButtonGroup';
import Commits from 'components/Commits';
import Entities from 'components/Entities';
import Layout from 'components/Layout';
import ProTip from 'components/ProTip';
import SearchInputField from 'components/SearchInputField';
import withAuthAsync from 'components/withAuth';
import { Form, Formik } from 'formik';
import { useMeQuery } from 'graphql/generated';
import { useFtsEntityLazyQuery, useFtsCommitLazyQuery } from 'graphql/generated/queryHandler';
import { NextPage } from 'next';
import React, { useState } from 'react';
import { useStyles } from 'utils';

const PAGESIZE = 2;

const Dashboard: NextPage<any> = () => {
  const { data, error, loading } = useMeQuery();
  const [findBy, setFindBy] = useState('entity');
  const classes = useStyles();
  const options = {
    context: { backend: 'queryHandler' },
    fetchPolicy: 'cache-and-network' as any,
  };
  const [
    searchEntity,
    { data: entities, loading: entityLoading, fetchMore: fetchMoreEntity },
  ] = useFtsEntityLazyQuery(options);
  const [
    searchCommit,
    { data: commits, loading: commitLoading, fetchMore: fetchMoreCommit },
  ] = useFtsCommitLazyQuery(options);

  let entityCount: number;
  let entityTotal: number;
  let commitCount: number;
  let commitTotal: number;

  if (!entityLoading && entities?.fullTextSearchEntity) {
    entityCount = Math.ceil((entities.fullTextSearchEntity.total as number) / PAGESIZE);
    entityTotal = entities?.fullTextSearchEntity.total as number;
  }

  if (!commitLoading && commits?.fullTextSearchCommit) {
    commitCount = Math.ceil((commits.fullTextSearchCommit.total as number) / PAGESIZE);
    commitTotal = commits?.fullTextSearchCommit.total as number;
  }

  const handlePageChangeEntity = async (event: React.ChangeEvent<unknown>, pagenumber: number) =>
    fetchMoreEntity?.({ variables: { cursor: (pagenumber - 1) * PAGESIZE } });

  const handlePageChangeCommit = async (event: React.ChangeEvent<unknown>, pagenumber: number) =>
    fetchMoreCommit?.({ variables: { cursor: (pagenumber - 1) * PAGESIZE } });

  const handleFindBy = (event: React.MouseEvent<HTMLElement>, item: string) => setFindBy(item);

  if (!data?.me)
    return (
      <Layout title="Dashboard" loading={loading} user={null} restrictedArea={false}>
        {error?.message}
      </Layout>
    );

  return (
    <Layout
      title="Dashboard"
      loading={entityLoading || commitLoading}
      user={data?.me}
      restrictedArea={true}>
      <Container>
        <br />
        <ToggleButtonGroup
          aria-label="text alignment"
          exclusive
          value={findBy}
          onChange={handleFindBy}>
          <ToggleButton value="entity" aria-label="find by entity">
            <FindInPageIcon />
            Entity
          </ToggleButton>
          <ToggleButton value="commit" aria-label="find by commit">
            <ChangeHistoryIcon />
            Commit
          </ToggleButton>
        </ToggleButtonGroup>
        <br />
        {findBy === 'entity' ? (
          <Formik
            initialValues={{ query: '', cursor: 0, pagesize: PAGESIZE }}
            onSubmit={async ({ query, cursor, pagesize }, { setSubmitting }) => {
              setSubmitting(true);
              try {
                searchEntity({ variables: { query, cursor, pagesize } });
              } catch (e) {
                console.error(e);
                setSubmitting(false);
              }
            }}>
            {({ isSubmitting }) => (
              <Form className={classes.form}>
                <Grid container spacing={3}>
                  <SearchInputField
                    isSubmitting={isSubmitting}
                    autoFocus={findBy === 'entity'}
                    placeholder="@type:org* @id:org* @event:{inc*} @creator:admin*"
                    label="entity"
                    total={entityTotal}
                  />
                  <Grid item xs={12}>
                    <Pagination
                      count={entityCount}
                      showFirstButton
                      showLastButton
                      onChange={handlePageChangeEntity}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Entities entities={entities?.fullTextSearchEntity?.items} />
                  </Grid>
                </Grid>
              </Form>
            )}
          </Formik>
        ) : (
          <Formik
            initialValues={{ query: '', cursor: 0, pagesize: PAGESIZE }}
            onSubmit={async ({ query, cursor, pagesize }, { setSubmitting }) => {
              setSubmitting(true);
              try {
                searchCommit({ variables: { query, cursor, pagesize } });
              } catch (e) {
                console.error(e);
                setSubmitting(false);
              }
            }}>
            {({ isSubmitting }) => (
              <Form>
                <Grid container spacing={3}>
                  <SearchInputField
                    isSubmitting={isSubmitting}
                    autoFocus={findBy !== 'entity'}
                    placeholder="@type:org* @id:org*  @creator:admin*"
                    label="commit"
                    total={commitTotal}
                  />
                  <Grid item xs={12}>
                    <Pagination
                      count={commitCount}
                      showFirstButton
                      showLastButton
                      onChange={handlePageChangeCommit}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Commits commits={commits?.fullTextSearchCommit?.items} />
                  </Grid>
                </Grid>
              </Form>
            )}
          </Formik>
        )}
        <ProTip />
      </Container>
    </Layout>
  );
};

export default withAuthAsync(Dashboard);
