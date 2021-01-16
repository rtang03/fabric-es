import Divider from '@material-ui/core/Divider';
import Grid from '@material-ui/core/Grid';
import Pagination from '@material-ui/lab/Pagination';
import { Form, Formik } from 'formik';
import { useFtsCommitLazyQuery, useFtsEntityLazyQuery } from 'graphql/generated/queryHandler';
import React from 'react';
import { useStyles } from 'utils';
import Commits from './Commits';
import Entities from './Entities';
import SearchInputField from './SearchInputField';

const PAGESIZE = 5;

const FullTextSearch: React.FC<{ findBy: string }> = ({ findBy }) => {
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
  const handlePageChange = (fetchMore: any) => async (
    event: React.ChangeEvent<unknown>,
    pagenumber: number
  ) => fetchMore?.({ variables: { cursor: (pagenumber - 1) * PAGESIZE } });

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

  return (
    <>
      <Divider />
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
                    onChange={handlePageChange(fetchMoreEntity)}
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
                    onChange={handlePageChange(fetchMoreCommit)}
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
    </>
  );
};

export default FullTextSearch;
