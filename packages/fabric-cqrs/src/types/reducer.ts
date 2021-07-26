import { OutputCommit } from '../queryHandler/types';
import {
  BaseEntity, BaseEvent, Commit, ORGAN_FIELD, TRACK_EVENT, TRACK_FIELD,
  TS_FIELD, CREATOR_FIELD, CREATED_FIELD,
} from '.';

/**
 * @about reducer computes the current state of an entity
 */
export type Reducer<TEntity = any, TEvent = any> = (
  history: TEvent[],
  initial?: TEntity
) => TEntity;

/**
 * @about domain entity specific callback function used in reducer
 */
export type ReducerCallback<TEntity extends BaseEntity, TEvent extends BaseEvent> = (entity: TEntity, event: TEvent) => TEntity;

/**
 * @about return high order reducer function
 */
// export const getReducer = <T extends BaseEntity, E extends BaseEvent>(callback: ReducerCallback<T, E>): Reducer<T, E> => (
//   history: E[],
//   initialState?: T
// ) => history.reduce(callback, initialState);
export const getReducer = <T extends BaseEntity, E extends BaseEvent>(callback: ReducerCallback<T, E>): Reducer<T, E> => (
  history: E[],
  initialState?: T
) => {
  return history.reduce((entity: T, event: E) => {
    const ntt = callback(entity, event);
    if (ntt) {
      if (!ntt[CREATOR_FIELD] && event.payload?.[CREATOR_FIELD]) ntt[CREATOR_FIELD] = event.payload[CREATOR_FIELD];
      if (!ntt[CREATED_FIELD] && event.payload?.[CREATED_FIELD]) ntt[CREATED_FIELD] = event.payload[CREATED_FIELD];
      if (event.payload?.[TS_FIELD]) ntt[TS_FIELD] = event.payload[TS_FIELD];
    }
    return ntt;
  }, initialState);
};

/**
 * @about reducer for private data tracking events.
 */
export const trackingReducer = (commits: Commit[]) => {
  const result = commits.reduce(
    (tracks, commit) => {
      if (
        commit.events?.filter((event) => event.type === TRACK_EVENT).length <= 0 &&
        !tracks[ORGAN_FIELD].includes(commit.mspId)
      ) {
        tracks[ORGAN_FIELD].push(commit.mspId);
      }

      commit.events?.forEach((event) => {
        if (event.type === TRACK_EVENT) {
          if (!tracks[TRACK_FIELD][event.payload.entityName])
            tracks[TRACK_FIELD][event.payload.entityName] = [];
          tracks[TRACK_FIELD][event.payload.entityName].push(commit.mspId);
        }
      });
      return tracks;
    },
    {
      [ORGAN_FIELD]: [],
      [TRACK_FIELD]: {},
    }
  );

  const olen = result[ORGAN_FIELD].length;
  const tlen = Object.values(result[TRACK_FIELD]).length;

  return olen > 0 && tlen > 0
    ? result
    : olen > 0
    ? { [ORGAN_FIELD]: result[ORGAN_FIELD] }
    : tlen > 0
    ? { [TRACK_FIELD]: result[TRACK_FIELD] }
    : null;
};

export const computeEntity = <T extends BaseEntity, E extends BaseEvent>(
  commits: (Commit | OutputCommit)[],
  reducer: Reducer<T, E>,
) => {
  const history = [];
  commits.forEach(({ events }) => events.forEach((event) => history.push(event)));

  const state = reducer(history);
  if (state) {
    Object.assign(state, trackingReducer(commits));
  } else {
    // If reducer returns empty, plus receiving a single commit with a single TRACK_EVENT event, meaning the prviate entity
    // is created before its public place holder
    if ((commits.length === 1) && (commits[0].events?.filter((event) => event.type === TRACK_EVENT).length === 1)) {
      return { reduced: false };
    }
  }

  return { state, reduced: true };
};
