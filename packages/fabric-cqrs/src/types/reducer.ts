import { BaseEntity, BaseEvent, Commit } from '.';

/**
 * @ignore
 */
export const TRACK_EVENT = 'PrivateDataTracked';

/**
 * @ignore
 */
export const TRACK_FIELD = '_remoteDataTracking';

/**
 * @ignore
 */
export const ORGAN_NAME = 'organization';

const ORGAN_FIELD = '_organization';

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
export const getReducer = <T extends BaseEntity, E extends BaseEvent>(callback: ReducerCallback<T, E>): Reducer<T, E> => (
  history: E[],
  initialState?: T
) => history.reduce(callback, initialState);

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
