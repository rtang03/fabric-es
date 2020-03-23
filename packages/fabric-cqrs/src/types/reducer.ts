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
