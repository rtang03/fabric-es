import type { BaseEvent, Commit } from '../../types';

/**
 * **createCommit** create Commit object
 * @returns [[Commit]]
 */
export const createCommit: <TEvent extends BaseEvent = any>(option: {
  id: string;
  entityName: string;
  version: number;
  events: TEvent[];
  signedRequest?: string;
}) => Commit = ({ id, entityName, version, events, signedRequest }) => {
  const now = Date.now();
  const date = new Date(now).toISOString().replace(/[^0-9]/g, '');
  const commitId = `${date}`;
  return Object.assign(
    {},
    {
      id,
      entityName,
      commitId,
      version,
      events,
      entityId: id,
    },
    { signedRequest }
  );
};
