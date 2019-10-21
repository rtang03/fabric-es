import { BaseEvent, Commit } from '../../types';

export function createCommit<TEvent extends BaseEvent = any>({
  id,
  entityName,
  version,
  events
}: {
  id: string;
  entityName: string;
  version: number;
  events: TEvent[];
}): Commit {
  const now = Date.now();
  const date = new Date(now).toISOString().replace(/[^0-9]/g, '');
  const commitId = `${date}`;
  const committedAt = now.toString();
  return Object.assign(
    {},
    {
      id,
      entityName,
      commitId,
      committedAt,
      version,
      events,
      entityId: id
    }
  );
}
