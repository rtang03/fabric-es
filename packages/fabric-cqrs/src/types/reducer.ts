import { Commit } from '.';

export const TRACK_EVENT = 'PrivateDataTracked';
export const TRACK_FIELD = '__remoteDataTracking';
export const ORGAN_FIELD = '__organization';

/**
 * **Reducer**
 */
export type Reducer<TEntity = any> = (history: { type: string; payload?: any }[], initial?: TEntity) => TEntity;

/**
 * **getReducer** return high order reducer function
 * @param reducer
 */
export const getReducer = <T, E>(reducer: (entity: T, event: E) => T) => (history: E[], initialState?: T) =>
  history.reduce(reducer, initialState);

// export type ReducerImpl<T = any> = (entity: T, event: { type: string; payload?: any }) => T;

// /**
//  * **buildReducer** return high order reducer function
//  * @param reducer
//  */
// export const buildReducer = <T = any>(
//   reducer: ReducerImpl
// ): Reducer<T> => ((history: { type: string; payload?: any }[], initialState?: T) => {
//   return history.reduce(reducer, initialState);
// });

/**
 * Reducer for private data tracking events.
 * @param commits 
 */
export const trackingReducer = (commits: Commit[]) => {
  const result =
    commits.reduce((tracks, commit) => {
      if (
        (commit.events?.filter(event => event.type === TRACK_EVENT).length <= 0) &&
        !tracks[ORGAN_FIELD].includes(commit.mspId)
      ) {
        tracks[ORGAN_FIELD].push(commit.mspId);
      }

      commit.events?.forEach(event => {
        if (event.type === TRACK_EVENT) {
          if (!tracks[TRACK_FIELD][event.payload.entityName]) tracks[TRACK_FIELD][event.payload.entityName] = [];
          tracks[TRACK_FIELD][event.payload.entityName].push(commit.mspId);
        }
      });
      return tracks;
    }, {
      [ORGAN_FIELD]: [],
      [TRACK_FIELD]: {}
    });

  const olen = result[ORGAN_FIELD].length;
  const tlen = Object.values(result[TRACK_FIELD]).length;
  if ((olen > 0) && (tlen > 0)) {
    return result;
  } else if (olen > 0) {
    return { [ORGAN_FIELD]: result[ORGAN_FIELD] };
  } else if (tlen > 0) {
    return { [TRACK_FIELD]: result[TRACK_FIELD] };
  } else {
    return null;
  }
};
