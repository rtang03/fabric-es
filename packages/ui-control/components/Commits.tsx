import { Commit } from 'graphql/generated/queryHandler';
import isEqual from 'lodash/isEqual';
import omit from 'lodash/omit';
import React from 'react';

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
          .map((commit) => (
            <pre key={commit.commitId as any}>{JSON.stringify(commit, null, 2)}</pre>
          ))
      ) : (
        <p>No data returned</p>
      )}
    </>
  );
};

export default Commits;
