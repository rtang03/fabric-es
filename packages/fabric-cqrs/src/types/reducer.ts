/**
 * **Reducer**
 */
export type Reducer<TEntity = any> = (history: { type: string; payload?: any }[], initial?: TEntity) => TEntity;

/**
 * **getReducer** return high order reducer function
 * @param reducer
 */
export const getReducer = <TEntity = any, TEvent = any>(reducer: (entity: TEntity, event: TEvent) => TEntity) =>
  (history: TEvent[], initialState?: TEntity) =>
    history.reduce(reducer, initialState);
