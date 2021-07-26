import { BaseEntity } from '.';

/**
 * @ignore
 */
export interface EntityType<TEntity extends BaseEntity> {
  new (...args: any[]): TEntity;
  parentName?: string;
  entityName: string;
}

/**
 * **Lifecycle**
 * Entity lifecycle markers
 * BEGIN  - start of lifecycle, only appear once as the first event
 * END    - end of lifecycle, only appear once as the last event
 * NORMAL - other events without restriction
 * @ignore
 */
export enum Lifecycle {
  NORMAL,
  BEGIN,
  END,
}

export type BaseEvent = {
  /** event type **/
  readonly type?: string;

  /** lifecycle type **/
  readonly lifeCycle?: Lifecycle;

  /** event payload **/
  payload?: any;
};

/**
 * System event name - creating private data
 * @ignore
 */
export const TRACK_EVENT = 'PrivateDataTracked';

/**
 * System field name - private data org list
 * @ignore
 */
export const TRACK_FIELD = '_privateData';

export const TRACK_FIELD_S = 'privateData';

/**
 * System field name - org list
 * @ignore
 */
export const ORGAN_FIELD = '_organization';

// export const ORGAN_FIELD_S = 'organization';

/**
 * System field name - commit timestamp
 * @ignore
 */
export const TS_FIELD = '_ts';

// export const TS_FIELD_C = 'ts';

// export const TS_FIELD_O = 'modifiedAt';

/**
 * System field name - enrollment ID used when creating the entity
 * @ignore
 */
export const CREATOR_FIELD = '_creator';

// export const CREATOR_FIELD_S = 'creator';

/**
 * System field name - timestamp when creating the entity
 * @ignore
 */
export const CREATED_FIELD = '_created';

// export const CREATED_FIELD_C = 'created';

// export const CREATED_FIELD_O = 'createdAt';

/**
 * @about Commit
 */
export type Commit = {
  /** (same as entityId) **/
  id: string;

  /** entity name **/
  entityName: string;

  /** version number **/
  version?: number;

  /** commit Id **/
  commitId?: string;

  /** entity Id **/
  entityId?: string;

  /** organization Id **/
  mspId?: string;

  /** RESERVED FIELD: events array **/
  events?: BaseEvent[];

  /** RESERVED FIELD: hash of privatedata's events string **/
  hash?: string;

  /** RESERVED FIELD: stringified events **/
  eventsString?: string;

  /** RESERVED FIELD: signed request **/
  signedRequest?: string;
};
