import { Commit } from '.';

export const TRACK_EVENT = 'PrivateDataTracked';
export const TRACK_FIELD = '_remoteDataTracking';
export const ORGAN_FIELD = '_organization';

/**
 * **Reducer**
 */
export type Reducer<TEntity = any> = (
  history: { type: string; payload?: any }[],
  initial?: TEntity
) => TEntity;

/**
 * **getReducer** return high order reducer function
 * @param reducer
 */
export const getReducer = <T, E>(reducer: (entity: T, event: E) => T) => (
  history: E[],
  initialState?: T
) => history.reduce(reducer, initialState);

/**
 * Reducer for private data tracking events.
 * @param commits
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
