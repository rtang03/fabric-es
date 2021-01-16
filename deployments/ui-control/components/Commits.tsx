import { Commit } from 'graphql/generated/queryHandler';
import isEqual from 'lodash/isEqual';
import omit from 'lodash/omit';
import React from 'react';
import CommitComponent from './Commit';

const Commits: React.FC<{ commits?: Commit[] }> = ({ commits }) => {
  return (
    <>
      {commits && !isEqual(commits, []) ? (
        commits
          .map<any>((commit) => omit(commit, '__typename'))
          .map((commit) => ({
            ...commit,
            events: JSON.parse(commit.eventsString),
            eventsString: undefined,
          }))
          .map((commit) => <CommitComponent key={commit.commitId} commit={commit} />)
      ) : (
        <p>No data returned</p>
      )}
    </>
  );
};

export default Commits;
