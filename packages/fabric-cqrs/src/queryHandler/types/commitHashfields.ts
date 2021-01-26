import { Commit } from '../../types';

/**
 * @about field definition used by Redis Hash record for Commit. Notice that there is name
 * conversion from "Commit" obtained from Fabric, to "Commit" stored in Redis. And, there
 * are additional fields in Redis, for sake better searching.
 */
export type CommitHashFields = {
  cid: Commit['commitId'];      // renamed field
  creator: string;              // renamed field; indexed
  event: string;                // additional field; indexed
  msp: Commit['mspId'];         // no change; indexed
  evstr: string;            // stringified
  id: Commit['entityId'];       // no change; indexed
  ts: number;                   // renamed field; indexed
  type: Commit['entityName'];   // rename field; indexed
  v: Commit['version'];         // rename field
};
