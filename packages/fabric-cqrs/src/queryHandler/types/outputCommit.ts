import type { Commit } from '../../types';

/**
 * @about postelector processes the [[CommitInRedis]]. It renders the query result
 * and, restore back to [[Commit]]; but appended with dervied field.
 */
export interface OutputCommit extends Commit {
  id: string;
  entityId: string;
  commitId?: string;
  entityName: string;
  ts: number;
  version: number;
  events: Record<string, unknown>[];
  event: string;
  mspId: string;
  signedRequest: string;
}
