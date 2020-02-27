export type Reducer<TEntity = any> = (history: { type: string; payload?: any }[], initial?: TEntity) => TEntity;

export const getReducer = <T, E>(reducer: (entity: T, event: E) => T) => (history: E[], initialState?: T) =>
  history.reduce(reducer, initialState);
