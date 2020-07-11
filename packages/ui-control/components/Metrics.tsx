import Container from '@material-ui/core/Container';
import Divider from '@material-ui/core/Divider';
import LinearProgress from '@material-ui/core/LinearProgress';
import Paper from '@material-ui/core/Paper';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableContainer from '@material-ui/core/TableContainer';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import Typography from '@material-ui/core/Typography';
import { useGetEntityInfoQuery, EntityInfo } from 'graphql/generated/queryHandler';
import omit from 'lodash/omit';
import React, { Fragment } from 'react';
import { useStyles } from 'utils';

const vertical = (items: string[]) =>
  items?.length
    ? items.reduce(
        (prev, curr) => (
          <div>
            <div>
              <Typography variant="caption">{prev}</Typography>
            </div>
            <div>
              <Typography variant="caption">{curr}</Typography>
            </div>
          </div>
        ),
        <Fragment />
      )
    : '-';

const Metrics: React.FC<any> = () => {
  const classes = useStyles();
  const { data, loading, error } = useGetEntityInfoQuery({
    context: { backend: 'queryHandler' },
    fetchPolicy: 'cache-and-network',
  });

  return (
    <>
      {loading ? (
        <LinearProgress />
      ) : (
        <>
          <Divider />
          <TableContainer component={Paper}>
            <Table className={classes.table} size="small" aria-label="a dense table">
              <TableHead>
                <TableRow>
                  <TableCell>Type</TableCell>
                  <TableCell align="right">Events</TableCell>
                  <TableCell align="right">Creators</TableCell>
                  <TableCell align="right">Orgs</TableCell>
                  <TableCell align="right">Tags</TableCell>
                  <TableCell align="right">Commits</TableCell>
                  <TableCell align="right">Total</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data?.getEntityInfo
                  .map((item) => omit(item, '__typename'))
                  .map(
                    ({
                      entityName,
                      events,
                      total,
                      totalCommit,
                      tagged,
                      orgs,
                      creators,
                    }: EntityInfo) => (
                      <TableRow>
                        <TableCell component="th" scope="row">
                          {entityName}
                        </TableCell>
                        <TableCell align="right">{vertical(events)}</TableCell>
                        <TableCell align="right">{vertical(creators)}</TableCell>
                        <TableCell align="right">{vertical(orgs)}</TableCell>
                        <TableCell align="right">{vertical(tagged)}</TableCell>
                        <TableCell align="right">{totalCommit}</TableCell>
                        <TableCell align="right">{total}</TableCell>
                      </TableRow>
                    )
                  )}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}
    </>
  );
};

export default Metrics;
