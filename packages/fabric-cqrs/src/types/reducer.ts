import { Commit } from '.';

export const TRACK_EVENT = 'PrivateDataTracked';

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
  const result: string[] = commits.reduce((tracks, commit) => {
    if (commit.events && commit.events.every((event) => {
      return (event.type === TRACK_EVENT);
    })) {
      tracks.push(commit.mspId);
    }
    return tracks;
  }, []);
  return { tracking: result };
};
