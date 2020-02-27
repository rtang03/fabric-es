import { assign } from 'lodash';
import { Commit } from '..';

export const splitKey = (key: string) => key.split('~');

export const makeKey = (keyParts: any[]) => keyParts.map(part => JSON.stringify(part)).join('~');

export const serialize = object => Buffer.from(JSON.stringify(object));

export const toRecord = (commit: Partial<Commit>) => assign({}, { [commit.commitId]: commit });

export const createCommitId = () => `${new Date(Date.now()).toISOString().replace(/[^0-9]/g, '')}`;

export const createInstance = ({
  id,
  entityName,
  version,
  events,
  commitId
}: {
  id: string;
  entityName: string;
  version: string;
  events: any[];
  commitId: string;
}) => {
  const now = Date.now();
  const committedAt = now.toString();

  return new Commit({
    id,
    entityName,
    commitId,
    committedAt,
    version: parseInt(version, 10),
    events,
    entityId: id
  });
};
