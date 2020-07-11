import Container from '@material-ui/core/Container';
import Divider from '@material-ui/core/Divider';
import LinearProgress from '@material-ui/core/LinearProgress';
import omit from 'lodash/omit';
import React from 'react';
import { useGetEntityInfoQuery } from '../graphql/generated/queryHandler';

const Metrics: React.FC<any> = () => {
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
          <Container>
            <pre>
              {JSON.stringify(
                data?.getEntityInfo.map((item) => omit(item, '__typename')),
                null,
                2
              )}
            </pre>
          </Container>
        </>
      )}
    </>
  );
};

export default Metrics;
