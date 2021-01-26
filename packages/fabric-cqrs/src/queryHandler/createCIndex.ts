import flatten from 'lodash/flatten';
import trimStart from 'lodash/trimStart';
import values from 'lodash/values';
import { Redisearch, FTSchemaField, FTCreateParameters } from 'redis-modules-sdk';
import type { Commit } from '../types';
import type { CommitDefaultSchema, CommitHashFields } from './types';

export const CIDX = 'cidx';

export const getCidxPrefix: () => string = () => 'c:';

/**
 * @about return redisKey in format of *c:entityName:entityId:commitId*
 * @params entityId
 * @params entityName
 * @params commitId
 */
export const getCommitKey: (commit: Commit) => string = ({ entityId, entityName, commitId }) =>
  `${getCidxPrefix()}${entityName}:${entityId}:${commitId}`;

/**
 * @about convert from Commit object to Hash object
 * @params [[Commit]]
 */
export const getCommitHashFields: (commit: Commit) => (string | number)[] = (commit) => {
  const evt = commit.events.reduce<string>((prev, { type }) => `${prev},${type}`, '');

  const fields: CommitHashFields = {
    // field 1: commitId
    cid: commit.commitId,
    // field 2: creator
    creator: commit.events[0]?.payload?._creator,
    // field 3: event name involved
    event: trimStart(evt, ','),
    // field 4: Fabric MSP Id
    msp: commit.mspId,
    // field 5: stringified events
    evstr: JSON.stringify(commit.events),
    // field 6: entityId
    id: commit.entityId,
    // field 7: this commit's timestamp
    ts: commit.events[0]?.payload?._ts || 0,
    // field 8: the same as EntityName
    type: commit.entityName,
    // field 9: commit verion number
    v: commit.version,
  };

  return flatten<string | number>(Object.entries(fields));
};

/**
 * @about default schema is used for secondary indexing
 */
const defaultSchema: CommitDefaultSchema = {
  // field 1: creator
  creator: { name: 'creator', type: 'TEXT' },
  // field 2: stringify list of event involved
  event: { name: 'event', type: 'TAG' },
  // field 3: commit Id
  id: { name: 'id', type: 'TEXT', sortable: true },
  // field 4: msp = Fabric MSP id
  msp: { name: 'msp', type: 'TAG' },
  // field 5: the same as entityName. "type" is more user friendly for rendering to UI
  type: { name: 'type', type: 'TEXT', sortable: true },
  // field 6: timestamp
  ts: { name: 'ts', type: 'NUMERIC', sortable: true },
};

const defaultParam: FTCreateParameters = {
  prefix: [{ count: 1, name: getCidxPrefix() }],
};

/**
 * @about create cidx - index of Commit
 * @params redisearch client
 * @params redisearch creation params
 */
export const createCIndex: (
  client: Redisearch,
  option?: { param: FTCreateParameters }
) => Promise<'OK'> = (client, { param } = { param: defaultParam }) =>
  client.create(CIDX, values<FTSchemaField>(defaultSchema), param);
