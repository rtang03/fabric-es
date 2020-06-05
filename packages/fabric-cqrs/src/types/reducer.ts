import { Commit, TRACK_EVENT } from '.';

/**
 * **Reducer**
 */
export type Reducer<TEntity = any> = (history: { type: string; payload?: any }[], initial?: TEntity) => TEntity;

/**
 * **getReducer** return high order reducer function
 * @param reducer
 */
export const getReducer = <TEntity = any>(
  reducer: (entity: TEntity, event: { type: string; payload?: any }) => TEntity
): Reducer<TEntity> => ((history: { type: string; payload?: any }[], initialState?: TEntity) => {
  return history.reduce(reducer, initialState);
});

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

// /**
//  * Reducer core
//  */
// export type ReducerCore = <TEntity = any, TEvent = any>(entity: TEntity, event: TEvent) => TEntity;

// /**
//  * Commits reducer
// */
// export type Reducer<TEntity = any> = (commits: Record<string, Commit>, initial?: TEntity) => TEntity;

// /**
//  * Construct a reducer using a 'reducer core' object.
//  * @param reducer the 'reducer core' with specific event handling logic.
//  */
// export const getReducer = <TEntity extends BaseEntity, TEvent extends BaseEvent>(
//   reducer: ReducerCore
// ): Reducer<TEntity> => ((commits: Record<string, Commit>, initialState?: TEntity) => {
//   const history = [];
//   Object.values(commits).forEach(({ mspId, events }) => {
//     events.forEach(item => {
//       if (item.type === TRACK_EVENT) item.mspId = mspId;
//       history.push(item);
//     });
//   });

//   return history.reduce((entity: TEntity, event: TEvent) => {
//     if (event.type === TRACK_EVENT) {
//       if (!entity.tracking) entity.tracking = [];
//       entity.tracking.push(event.mspId);
//       return entity;
//     } else {
//       return reducer(entity, event);
//     }
//   }, initialState);
// });
