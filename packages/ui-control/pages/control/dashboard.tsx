import Container from '@material-ui/core/Container';
import AddBoxIcon from '@material-ui/icons/AddBox';
import AssessmentIcon from '@material-ui/icons/Assessment';
import ChangeHistoryIcon from '@material-ui/icons/ChangeHistory';
import FindInPageIcon from '@material-ui/icons/FindInPage';
import ToggleButton from '@material-ui/lab/ToggleButton';
import ToggleButtonGroup from '@material-ui/lab/ToggleButtonGroup';
import CreateCommit from 'components/CreateCommit';
import FullTextSearch from 'components/FullTextSearch';
import Layout from 'components/Layout';
import Metrics from 'components/Metrics';
import ProTip from 'components/ProTip';
import withAuth from 'components/withAuth';
import { useMeQuery } from 'graphql/generated';
import { NextPage } from 'next';
import React, { useState } from 'react';

const Dashboard: NextPage<any> = () => {
  const { data, error, loading } = useMeQuery();
  const [selection, setSelection] = useState('metrics');

  const handleSelection = (event: React.MouseEvent<HTMLElement>, item: string) =>
    setSelection(item);

  if (!data?.me)
    return (
      <Layout title="Dashboard" loading={loading} user={null} restricted={false}>
        {error?.message}
      </Layout>
    );

  return (
    <Layout title="Dashboard" loading={loading} user={data?.me} restricted={true}>
      <Container>
        <br />
        <ToggleButtonGroup
          aria-label="text alignment"
          exclusive
          value={selection}
          onChange={handleSelection}>
          <ToggleButton value="metrics" aria-label="loaded entity">
            <AssessmentIcon />
            Metrics
          </ToggleButton>
          <ToggleButton value="entity" aria-label="find by entity">
            <FindInPageIcon />
            By Type
          </ToggleButton>
          <ToggleButton value="commit" aria-label="find by commit">
            <ChangeHistoryIcon />
            History
          </ToggleButton>
          <ToggleButton value="newcommit" aria-label="new commit">
            <AddBoxIcon />
            Commit
          </ToggleButton>
        </ToggleButtonGroup>
        <br />
        {
          {
            ['metrics' as string]: <Metrics />,
            ['entity']: <FullTextSearch findBy={selection} />,
            ['commit']: <FullTextSearch findBy={selection} />,
            ['newcommit']: <CreateCommit />,
          }[selection]
        }
        <ProTip />
      </Container>
    </Layout>
  );
};

export default withAuth(Dashboard);
